/**
 * MSSQL-backed backend for Romanishan Reciprocity Assessment
 * - SQL Server Express (SQL Authentication)
 * - Auto-creates tables if missing
 * - Endpoints:
 *    POST /api/register
 *    POST /api/login
 *    POST /api/submit    (protected)
 *    GET  /api/list      (protected)
 *    GET  /api/export-csv (protected)
 *    GET  /api/export-xlsx (protected)
 * - Serves static frontend from ../frontend
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const fs = require('fs');
// Optional dependencies (prevent crashes if missing)
let jwt; let JWT_AVAILABLE = true;
try { jwt = require('jsonwebtoken'); } catch { JWT_AVAILABLE = false; console.warn('[server] jsonwebtoken not installed. Set DEV_NO_AUTH=true to bypass auth in dev.'); }
let bcrypt; let BCRYPT_AVAILABLE = true;
try { bcrypt = require('bcryptjs'); } catch { BCRYPT_AVAILABLE = false; console.warn('[server] bcryptjs not installed. Set DEV_NO_AUTH=true to bypass auth in dev.'); }
let ExcelJS; let EXCEL_AVAILABLE = true;
try { ExcelJS = require('exceljs'); } catch { EXCEL_AVAILABLE = false; console.warn('[server] exceljs not installed. /api/export-xlsx will be disabled.'); }
let createCsvWriter; let CSV_AVAILABLE = true;
try { ({ createObjectCsvWriter: createCsvWriter } = require('csv-writer')); } catch { CSV_AVAILABLE = false; console.warn('[server] csv-writer not installed. /api/export-csv will be disabled.'); }

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';
const DEV_NO_AUTH = (process.env.DEV_NO_AUTH || 'false') === 'true' || !JWT_AVAILABLE || !BCRYPT_AVAILABLE;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ---- Centralized config builder (always use process.env.*) ----
function buildSqlConfig() {
  const hasPort = !!process.env.MSSQL_PORT && /^\d+$/.test(process.env.MSSQL_PORT);
  const hasInstance = !!process.env.MSSQL_INSTANCE;
  const preferPort = hasPort;

  if (!process.env.MSSQL_SERVER) {
    throw new Error('MSSQL_SERVER is not defined in environment');
  }
  if (!process.env.MSSQL_USER) {
    throw new Error('MSSQL_USER is not defined in environment');
  }
  if (!process.env.MSSQL_PASSWORD) {
    throw new Error('MSSQL_PASSWORD is not defined in environment');
  }
  if (!process.env.MSSQL_DATABASE) {
    throw new Error('MSSQL_DATABASE is not defined in environment');
  }

  return {
    server: process.env.MSSQL_SERVER,
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    database: process.env.MSSQL_DATABASE,
    ...(preferPort ? { port: parseInt(process.env.MSSQL_PORT, 10) } : {}),
    options: {
      encrypt: (process.env.MSSQL_ENCRYPT || 'true') === 'true',
      trustServerCertificate: (process.env.MSSQL_TRUST_SERVER_CERTIFICATE || 'true') === 'true',
      enableArithAbort: true,
      ...(!preferPort && hasInstance ? { instanceName: process.env.MSSQL_INSTANCE } : {})
    },
    connectionTimeout: parseInt(process.env.MSSQL_CONNECTION_TIMEOUT || '30000', 10),
    requestTimeout: parseInt(process.env.MSSQL_REQUEST_TIMEOUT || '30000', 10),
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
  };
}

// ---- Singleton pool (prevents duplicate connects and stray env refs) ----
let poolPromise = null;
let dbUp = false;
let targetLabel = '';
let DEV_USER_ID = null; // <= added: real DB id used in dev bypass

function getPool() {
  if (!poolPromise) {
    const cfg = buildSqlConfig();
    const preferPort = Object.prototype.hasOwnProperty.call(cfg, 'port');
    targetLabel = preferPort ? `${cfg.server}:${cfg.port} (static TCP)` : `${cfg.server}\\\\${process.env.MSSQL_INSTANCE} (SQL Browser)`;
    poolPromise = new sql.ConnectionPool(cfg).connect()
      .then(pool => {
        dbUp = true;
        console.log(`[mssql] connected to ${targetLabel} (encrypt=${cfg.options.encrypt}, trustServerCertificate=${cfg.options.trustServerCertificate})`);
        pool.on('error', err => {
          dbUp = false;
          console.error('[mssql] pool error:', err.message);
        });
        return pool;
      })
      .catch(err => {
        dbUp = false;
        console.error('[mssql] connection error:', err.message);
        throw err;
      });
  }
  return poolPromise;
}

// Kick off connect (non-blocking)
getPool().catch(() => { /* logged above */ });

// After pool connects, ensure schema once
function ensureSchema() {
  return (async () => {
    const pool = await getPool();
    // create users table
    const createUsers = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password_hash NVARCHAR(512) NOT NULL,
        name NVARCHAR(255),
        role NVARCHAR(50) DEFAULT 'user',
        created_at DATETIME2 DEFAULT SYSUTCDATETIME()
      );
    `;
    // create assessments table
    const createAssessments = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'assessments')
      CREATE TABLE assessments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        subject_name NVARCHAR(255),
        timestamp DATETIME2 DEFAULT SYSUTCDATETIME(),
        TP INT, BI INT, OE INT, LC INT, SC INT, PS INT,
        IOS FLOAT, EOS FLOAT, CLASSIFICATION NVARCHAR(100), CONFIDENCE FLOAT,
        raw_json NVARCHAR(MAX)
      );
    `;
    await pool.request().query(createUsers);
    await pool.request().query(createAssessments);
    console.log('Schema ensured (users, assessments)');
  })();
}

// Ensure a dev user exists and capture its id (used when DEV_NO_AUTH=true)
async function ensureDevUser() {
  if (!DEV_NO_AUTH) return;
  const pool = await getPool();
  // Try find existing dev user
  const sel = await pool.request()
    .input('email', sql.NVarChar(255), 'dev@example.com')
    .query('SELECT id FROM users WHERE email=@email');
  if (sel.recordset && sel.recordset.length) {
    DEV_USER_ID = Number(sel.recordset[0].id);
  } else {
    // Insert lightweight dev user (no real password needed in dev)
    const ins = await pool.request()
      .input('email', sql.NVarChar(255), 'dev@example.com')
      .input('password_hash', sql.NVarChar(512), 'dev')
      .input('name', sql.NVarChar(255), 'Dev User')
      .query(`INSERT INTO users (email, password_hash, name, role)
              VALUES (@email, @password_hash, @name, 'user');
              SELECT SCOPE_IDENTITY() AS id;`);
    DEV_USER_ID = Number(ins.recordset[0].id);
  }
  console.log(`[dev] using users.id=${DEV_USER_ID} for DEV_NO_AUTH submissions`);
}

// Trigger ensureSchema once the pool is ready
getPool()
  .then(() => ensureSchema().then(ensureDevUser).catch(err => console.error('ensureSchema/ensureDevUser error:', err.message)))
  .catch(() => {});

// ---- Health endpoints ----
app.get('/health', async (req, res) => {
  try {
    await getPool();
    res.json({ ok: true, service: 'backend', db: dbUp, target: targetLabel });
  } catch (e) {
    res.status(503).json({ ok: false, service: 'backend', db: false, target: targetLabel, error: e.message });
  }
});
app.get('/api/health', async (req, res) => {
  try {
    await getPool();
    res.json({ ok: true, db: dbUp, target: targetLabel });
  } catch (e) {
    res.status(503).json({ ok: false, db: false, target: targetLabel, error: e.message });
  }
});

// ---- DB ping ----
app.get('/db/ping', async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT 1 AS ok');
    res.json({ ok: true, result: r.recordset[0], target: targetLabel });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, target: targetLabel });
  }
});

// ---- Gate for DB-backed routes ----
function requireDb(req, res, next) {
  if (!dbUp) return res.status(503).json({ error: 'Database not ready', target: targetLabel });
  return next();
}

// Auth middleware (bypass in dev)
function authMiddleware(req, res, next) {
  if (DEV_NO_AUTH) {
    // Use a real users.id (created/fetched via ensureDevUser)
    req.user = { id: DEV_USER_ID ?? 0, email: 'dev@example.com', role: 'user' };
    return next();
  }
  if (!JWT_AVAILABLE) return res.status(503).json({ error: 'Auth unavailable: install jsonwebtoken or set DEV_NO_AUTH=true' });
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Invalid Authorization header' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/* -------------------------
   Authentication Endpoints
   ------------------------- */

// Register
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Dev shortcut
  if (DEV_NO_AUTH) {
    // return the dev user identity we use for inserts so user_id is consistent
    return res.json({ token: 'dev', user: { id: DEV_USER_ID ?? 0, email: email || 'dev@example.com', name: name || null, role: 'user' } });
  }

  if (!BCRYPT_AVAILABLE || !JWT_AVAILABLE) {
    return res.status(503).json({ error: 'Auth libs missing. Install bcryptjs and jsonwebtoken, or set DEV_NO_AUTH=true' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    // ...existing code...
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .input('password_hash', sql.NVarChar(512), password_hash)
      .input('name', sql.NVarChar(255), name || null)
      .query(`INSERT INTO users (email, password_hash, name) VALUES (@email, @password_hash, @name); SELECT SCOPE_IDENTITY() AS id;`);
    const newId = result.recordset && result.recordset[0] ? result.recordset[0].id : null;
    const user = { id: newId, email, role: 'user', name: name || null };
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user });
  } catch (err) {
    console.error('Register error', err.message || err);
    return res.status(400).json({ error: 'Registration error', details: err.message || String(err) });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Dev shortcut
  if (DEV_NO_AUTH) {
    return res.json({ token: 'dev', user: { id: DEV_USER_ID ?? 0, email: email || 'dev@example.com', role: 'user' } });
  }

  if (!BCRYPT_AVAILABLE || !JWT_AVAILABLE) {
    return res.status(503).json({ error: 'Auth libs missing. Install bcryptjs and jsonwebtoken, or set DEV_NO_AUTH=true' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(255), email)
      .query(`SELECT id, email, password_hash, name, role FROM users WHERE email = @email`);
    const row = result.recordset && result.recordset[0];
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const user = { id: row.id, email: row.email, name: row.name, role: row.role };
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user });
  } catch (err) {
    console.error('Login error', err.message || err);
    res.status(500).json({ error: 'Server error', details: err.message || String(err) });
  }
});

/* -------------------------
   Assessment Endpoints
   ------------------------- */

// Helper: compute Romanishan scores
function computeScores({ TP, BI, OE, LC, SC, PS }) {
  const tp = Number(TP || 0);
  const bi = Number(BI || 0);
  const oe = Number(OE || 0);
  const lc = Number(LC || 0);
  const sc = Number(SC || 0);
  const ps = Number(PS || 0);

  const IOS = 0.40 * tp + 0.25 * bi + 0.20 * ps + 0.15 * sc;
  const EOS = 0.40 * oe + 0.30 * lc + 0.20 * sc + 0.10 * bi;
  const DIFF = IOS - EOS;
  const CONFIDENCE = Math.max(0, 100 - Math.abs(DIFF));

  let CLASSIFICATION = 'Mixed / Needs deeper assessment';
  if (oe >= 80) CLASSIFICATION = 'High-Risk Immediate';
  else if (IOS >= 70 && EOS <= 45) CLASSIFICATION = 'Individual-driven';
  else if (EOS >= 70 && IOS <= 45) CLASSIFICATION = 'Environment-driven';
  else if (IOS >= 50 && EOS >= 50) CLASSIFICATION = 'Mixed-origin';
  else if (Math.abs(DIFF) < 10 && IOS < 50 && EOS < 50) CLASSIFICATION = 'Ambiguous / Low signal';

  return { tp, bi, oe, lc, sc, ps, IOS, EOS, CONFIDENCE, CLASSIFICATION };
}

// Submit assessment (protected)
app.post('/api/submit', authMiddleware, async (req, res) => {
  try {
    const { subject_name, TP, BI, OE, LC, SC, PS } = req.body;
    if (!subject_name) return res.status(400).json({ error: 'subject_name required' });

    const scores = computeScores({ TP, BI, OE, LC, SC, PS });
    const raw = JSON.stringify({ TP: scores.tp, BI: scores.bi, OE: scores.oe, LC: scores.lc, SC: scores.sc, PS: scores.ps });

    const insertSql = `
      INSERT INTO assessments (user_id, subject_name, TP, BI, OE, LC, SC, PS, IOS, EOS, CLASSIFICATION, CONFIDENCE, raw_json)
      VALUES (@user_id, @subject_name, @TP, @BI, @OE, @LC, @SC, @PS, @IOS, @EOS, @CLASSIFICATION, @CONFIDENCE, @raw_json);
      SELECT SCOPE_IDENTITY() AS id;
    `;

    const pool = await getPool();
    const request = pool.request()
      // keep real id, including 0 in non-dev; in dev we now pass DEV_USER_ID (not NULL)
      .input('user_id', sql.Int, (req.user?.id ?? null))
      .input('subject_name', sql.NVarChar(255), subject_name)
      .input('TP', sql.Int, scores.tp)
      .input('BI', sql.Int, scores.bi)
      .input('OE', sql.Int, scores.oe)
      .input('LC', sql.Int, scores.lc)
      .input('SC', sql.Int, scores.sc)
      .input('PS', sql.Int, scores.ps)
      .input('IOS', sql.Float, scores.IOS)
      .input('EOS', sql.Float, scores.EOS)
      .input('CLASSIFICATION', sql.NVarChar(100), scores.CLASSIFICATION)
      .input('CONFIDENCE', sql.Float, scores.CONFIDENCE)
      .input('raw_json', sql.NVarChar(sql.MAX), raw);

    const result = await request.query(insertSql);
    const newId = result.recordset && result.recordset[0] ? result.recordset[0].id : null;

    res.json({ id: newId, IOS: scores.IOS, EOS: scores.EOS, CLASSIFICATION: scores.CLASSIFICATION, CONFIDENCE: scores.CONFIDENCE });
  } catch (err) {
    console.error('Submit error', err.message || err);
    res.status(500).json({ error: 'Server error', details: err.message || String(err) });
  }
});

// List assessments (protected)
app.get('/api/list', authMiddleware, async (req, res) => {
  try {
    const pool = await getPool(); // FIX: acquire pool
    const q = `SELECT TOP (1000) * FROM assessments ORDER BY timestamp DESC`;
    const result = await pool.request().query(q);
    res.json(result.recordset || []);
  } catch (err) {
    console.error('List error', err.message || err);
    res.status(500).json({ error: 'DB error', details: err.message || String(err) });
  }
});

// Export CSV (guard when csv-writer missing)
app.get('/api/export-csv', authMiddleware, async (req, res) => {
  if (!CSV_AVAILABLE) return res.status(503).json({ error: 'CSV export unavailable (install csv-writer)' });
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT * FROM assessments ORDER BY timestamp DESC`);
    const rows = result.recordset || [];
    const tmpPath = path.join(__dirname, 'assessments_export.csv');
    const headers = rows.length > 0 ? Object.keys(rows[0]).map(k => ({ id: k, title: k })) : [
      { id: 'id', title: 'id' }, { id: 'subject_name', title: 'subject_name' }, { id: 'timestamp', title: 'timestamp' },
      { id: 'TP', title: 'TP' }, { id: 'BI', title: 'BI' }, { id: 'OE', title: 'OE' }, { id: 'LC', title: 'LC' },
      { id: 'SC', title: 'SC' }, { id: 'PS', title: 'PS' }, { id: 'IOS', title: 'IOS' }, { id: 'EOS', title: 'EOS' },
      { id: 'CLASSIFICATION', title: 'CLASSIFICATION' }, { id: 'CONFIDENCE', title: 'CONFIDENCE' }, { id: 'raw_json', title: 'raw_json' }
    ];
    const csvWriter = createCsvWriter({ path: tmpPath, header: headers });
    await csvWriter.writeRecords(rows);
    res.download(tmpPath, 'assessments.csv', err => { if (err) console.error(err); try { fs.unlinkSync(tmpPath); } catch(e){} });
  } catch (err) {
    console.error('Export CSV error', err.message || err);
    res.status(500).json({ error: 'Export error', details: err.message || String(err) });
  }
});

// Export XLSX (guard when exceljs missing)
app.get('/api/export-xlsx', authMiddleware, async (req, res) => {
  if (!EXCEL_AVAILABLE) return res.status(503).json({ error: 'Excel export unavailable (install exceljs)' });
  try {
    const pool = await getPool();
    const result = await pool.request().query(`SELECT * FROM assessments ORDER BY timestamp DESC`);
    const rows = result.recordset || [];
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('assessments');
    if (rows.length > 0) {
      sheet.columns = Object.keys(rows[0]).map(k => ({ header: k, key: k }));
      rows.forEach(r => sheet.addRow(r));
    } else {
      sheet.columns = [
        { header: 'id', key: 'id' }, { header: 'subject_name', key: 'subject_name' }, { header: 'timestamp', key: 'timestamp' },
        { header: 'TP', key: 'TP' }, { header: 'BI', key: 'BI' }, { header: 'OE', key: 'OE' }, { header: 'LC', key: 'LC' },
        { header: 'SC', key: 'SC' }, { header: 'PS', key: 'PS' }, { header: 'IOS', key: 'IOS' }, { header: 'EOS', key: 'EOS' },
        { header: 'CLASSIFICATION', key: 'CLASSIFICATION' }, { header: 'CONFIDENCE', key: 'CONFIDENCE' }, { header: 'raw_json', key: 'raw_json' }
      ];
    }
    const tmpPath = path.join(__dirname, 'assessments_export.xlsx');
    await workbook.xlsx.writeFile(tmpPath);
    res.download(tmpPath, 'assessments.xlsx', err => { if (err) console.error(err); try { fs.unlinkSync(tmpPath); } catch(e){} });
  } catch (err) {
    console.error('Export XLSX error', err.message || err);
    res.status(500).json({ error: 'Export error', details: err.message || String(err) });
  }
});

// Serve frontend static files (note: repo folder is "Frontend")
const FRONTEND_DIR = path.join(__dirname, '..', 'Frontend');
if (fs.existsSync(FRONTEND_DIR)) {
  app.use('/', express.static(FRONTEND_DIR));
} else {
  console.warn('Frontend folder not found at ../Frontend. You can still use API endpoints.');
}

// Start server on 0.0.0.0 to accept external requests (CORS enabled)
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`[server] listening on http://${HOST}:${PORT} (CORS enabled). Try GET /health and /db/ping`);
});
