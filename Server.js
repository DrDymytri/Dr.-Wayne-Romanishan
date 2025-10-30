// Optional MSSQL import (prevents crash if module is not installed)
let sql;
let MSSQL_AVAILABLE = true;
try {
  sql = require('mssql');
} catch (e) {
  MSSQL_AVAILABLE = false;
  console.warn('[server] Optional dependency "mssql" not found. DB routes will return 503 until installed (npm i mssql).');
}

const express = require('express');
const app = express();

const config = require('./config');

// Simple guard middleware for DB-backed routes
function requireDb(req, res, next) {
  if (!MSSQL_AVAILABLE) {
    return res.status(503).json({
      error: 'Database module "mssql" not installed. Run: npm i mssql',
    });
  }
  return next();
}

app.get('/data', async (req, res) => {
  try {
    const result = await sql.query`SELECT * FROM your_table`;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
