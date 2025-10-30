/* global React, ReactDOM, fetch, localStorage, window, document */
(() => {
  'use strict';

  const e = React.createElement;
  const { useState, useEffect, useRef } = React;

  // API base detection: use same origin by default, or set window.API_BASE before loading this script
  const API_BASE = window.API_BASE || (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '');

  const buildUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path);

  // ---------- Helpers ----------
  const storeToken = (token, user) => {
    localStorage.setItem('r_token', token);
    localStorage.setItem('r_user', JSON.stringify(user || null));
  };
  const loadToken = () => localStorage.getItem('r_token') || null;
  const loadUser = () => {
    try { return JSON.parse(localStorage.getItem('r_user')); } catch { return null; }
  };
  const clearAuth = () => { localStorage.removeItem('r_token'); localStorage.removeItem('r_user'); };

  async function apiFetch(path, opts = {}) {
    const token = loadToken();
    opts.headers = opts.headers || {};
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    try {
      const res = await fetch(buildUrl(path), opts);
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch(e) { json = text; }
      return { ok: res.ok, status: res.status, json, text };
    } catch (err) {
      return { ok:false, error: err.message || String(err) };
    }
  }

  function round1(v){ return Math.round(v*10)/10; }

  // ---------- Romanishan scoring ----------
  function computeROM({TP, BI, OE, LC, SC, PS}) {
    const tp = Number(TP||0), bi = Number(BI||0), oe = Number(OE||0), lc = Number(LC||0), sc = Number(SC||0), ps = Number(PS||0);
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
    return { tp, bi, oe, lc, sc, ps, IOS:round1(IOS), EOS:round1(EOS), CONFIDENCE:round1(CONFIDENCE), CLASSIFICATION };
  }

  // ---------- Question bank (full guided interview) ----------
  // Each q.id must be unique
  const SECTIONS = [
    {
      id: 'context',
      title: 'Intake & Context',
      description: 'Capture who we are assessing and context for this session.',
      questions: [
        { id:'subject_name', label:'Participant full name', type:'text', help:'Name or identifier (not necessarily legal name)' },
        { id:'role', label:'Participant role / job title', type:'text', help:'Their position or role in the organization' },
        { id:'context_short', label:'Briefly describe what brought you here today (one sentence).', type:'text' }
      ]
    },
    {
      id: 'baseline',
      title: 'Baseline Emotional & Cognitive State',
      description: 'Assess participant’s general stress, anxiety, and self-perception.',
      questions: [
        { id:'stress_level', domain:'PS', label:'On a scale from 0–100, how stressed or anxious have you felt at work this week?', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Can you describe a specific incident that caused this stress?' },
        { id:'misunderstood', domain:'TP', label:'How often do you feel misunderstood or misjudged by colleagues?', type:'likert', min:0, max:100, followupThreshold:75, followupPrompt:'Give a concrete example of a situation where you felt misunderstood.' },
        { id:'performance_worry', domain:'BI', label:'How often do you worry about your performance or making mistakes?', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Describe a recent moment that made you worry.' }
      ]
    },
    {
      id:'perception',
      title:'Threat Perception & Cognitive Patterns',
      description:'Questions to explore internal perception of threat or negative intent.',
      questions: [
        { id:'q_tp_1', domain:'TP', label:'Think about a minor mistake you recently made. How likely did you feel it would lead to serious consequences?', type:'likert', min:0, max:100, followupThreshold:75, followupPrompt:'Can you describe what worst-case scenario you imagined?' },
        { id:'q_tp_2', domain:'TP', label:'When colleagues are silent, how often do you assume negative intent?', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Give an example of a situation where you felt this way.' },
        { id:'q_tp_3', domain:'TP', label:'When thinking about upcoming tasks, how often do you anticipate the worst possible outcome?', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Describe a recent task and your expectations.' }
      ]
    },
    {
      id:'behavioral',
      title:'Behavioral Patterns & Consistency',
      description:'Assess task performance, avoidance behaviors, and consistency.',
      questions: [
        { id:'q_bi_1', domain:'BI', label:'Reflect on your work quality: is it steady and consistent over time?', type:'likert', min:0, max:100, reverse:true },
        { id:'q_bi_2', domain:'BI', label:'Do you sometimes avoid tasks because you fear criticism?', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Give an example of a task you avoided recently.' },
        { id:'q_bi_3', domain:'BI', label:'Have you received any recent warnings or near-misses?', type:'likert', min:0, max:100 }
      ]
    },
    {
      id:'environment',
      title:'Objective Exposure & Leadership Clarity',
      description:'Capture objective incidents and clarity of leadership/role expectations.',
      questions: [
        { id:'q_oe_1', domain:'OE', label:'Have you experienced disrespect, threats, or bullying at work recently?', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Describe a specific incident if comfortable.' },
        { id:'q_lc_1', domain:'LC', label:'How clearly does your manager provide feedback and expectations?', type:'likert', min:0, max:100, reverse:true },
        { id:'q_lc_2', domain:'LC', label:'Are your responsibilities and role expectations clearly documented?', type:'likert', min:0, max:100, reverse:true },
        { id:'q_oe_2', domain:'OE', label:'Are there formal HR records or warnings involving you recently?', type:'likert', min:0, max:100 }
      ]
    },
    {
      id:'social',
      title:'Team Climate & Social Influence',
      description:'How team dynamics and social rumors affect perception.',
      questions: [
        { id:'q_sc_1', domain:'SC', label:'How often do negative stories or rumors spread on your team?', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Provide an example if possible.' },
        { id:'q_sc_2', domain:'SC', label:'When someone struggles, does the team generally support them?', type:'likert', min:0, max:100, reverse:true }
      ]
    },
    {
      id:'physio',
      title:'Physiological / Acute Stress',
      description:'Capture acute stress symptoms and physiological response.',
      questions: [
        { id:'q_ps_1', domain:'PS', label:'Have you had trouble sleeping due to work worries?', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Describe a specific instance if comfortable.' },
        { id:'q_ps_2', domain:'PS', label:'Do you experience rapid heartbeat, panic, or tension related to work?', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Describe when this typically occurs.' }
      ]
    },
    {
      id:'self_role_fit',
      title:'Role Alignment & Satisfaction',
      description:'Evaluate if the participant is in the right role and environment for optimal performance and satisfaction.',
      questions:[
        { id:'self_strength_alignment', domain: 'BI', label:'I feel my skills and strengths are fully utilized in my role.', type:'likert', min:0, max:100, followupThreshold:65, followupPrompt:'Explain any areas where you feel underutilized.' },
        { id:'self_happiness', domain: 'PS', label:'I feel motivated and satisfied in my current role and department.', type:'likert', min:0, max:100, followupThreshold:65, followupPrompt:'Describe sources of dissatisfaction if any.' },
        { id:'self_stress_origin', domain: 'TP', label:'The main sources of my stress are internal (my own approach) or external (environment/workplace).', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Provide examples that clarify the source.' }
      ]
    },

    // ------------------ Peer / Coworker Assessment ------------------
    {
      id:'coworker',
      title:'Peer Perspective (Covert)',
      description:'Covert questions to evaluate performance, team dynamics, and environmental stressors from peers.',
      questions:[
        { id:'peer_initiative', domain: 'LC', label:'The participant volunteers for challenging tasks.', type:'likert', min:0, max:100, followupThreshold:80, followupPrompt:'Provide an example of when this occurred.' },
        { id:'peer_conflict_subtle', domain: 'SC', label:'The participant shows subtle frustration with team processes.', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Explain what you observed.' },
        { id:'peer_hidden_bias', domain: 'SC', label:'Participant contributions are sometimes downplayed.', type:'likert', min:0, max:100, followupThreshold:65, followupPrompt:'Give an example.' },
        { id:'peer_alignment', domain: 'LC', label:'The participant is in a role suited to their skills.', type:'likert', min:0, max:100, followupThreshold:60, followupPrompt:'Describe misalignment observed.' }
      ]
    },

    // ------------------ Supervisor Assessment ------------------
    {
      id:'supervisor',
      title:'Immediate Supervisor Perspective (Covert)',
      description:'Covert questions to evaluate environmental factors and performance from supervisor perspective.',
      questions:[
        { id:'leader_motivation', domain: 'BI', label:'The participant performs at their full potential.', type:'likert', min:0, max:100, reverse:true, followupThreshold:70, followupPrompt:'Describe instances suggesting underperformance.' },
        { id:'leader_hidden_stress', domain: 'PS', label:'The participant shows stress that is not openly communicated.', type:'likert', min:0, max:100, followupThreshold:65, followupPrompt:'Provide examples.' },
        { id:'leader_role_fit', domain: 'TP', label:'The participant’s current role aligns with strengths.', type:'likert', min:0, max:100, reverse:true, followupThreshold:60, followupPrompt:'Describe any misalignment.' },
        { id:'leader_environmental_impact', domain: 'OE', label:'Team or organizational dynamics limit the participant’s performance.', type:'likert', min:0, max:100, followupThreshold:70, followupPrompt:'Provide context or incidents.' }
      ]
    },
    {
      id:'reflection',
      title:'Reflection & Insight',
      description:'Capture awareness of perception versus objective facts.',
      questions: [
        { id:'insight_1', label:'How confident are you that your concerns are caused by external actions rather than personal perceptions?', type:'likert', min:0, max:100 },
        { id:'insight_text', label:'Please briefly describe an example that illustrates your perspective (optional):', type:'text' }
      ]
    }
  ];

  // ---------- UI components ----------
  function Header({ user, onLogout }) {
    return e('header', { className:'mb-6' },
      e('div', { className:'flex items-center justify-between' },
        e('div', null,
          e('h1', { className:'text-2xl font-bold text-sky-700' }, 'MDOA Solutions'),
          e('div', { className:'text-sm text-slate-600' }, 'Romanishan Reciprocity — Guided Assessment')
        ),
        e('div', null,
          user
            ? e('div', { className:'text-right' },
                e('div', { className:'text-sm text-slate-700' }, `Signed in: ${user.name || user.email}`),
                e('button', { onClick:onLogout, className:'mt-2 inline-block bg-gray-200 text-slate-800 px-3 py-1 rounded-md' }, 'Log out')
              )
            : e('div', { className:'text-sm text-slate-600' }, 'Not signed in')
        )
      )
    );
  }

  function ProgressBar({ currentIndex, total }) {
    const pct = Math.round(((currentIndex) / Math.max(1, total)) * 100);
    return e('div', { className:'mb-4' },
      e('div', { className:'text-sm text-slate-600 mb-1' }, `Progress: ${pct}%`),
      e('div', { className:'w-full h-2 bg-gray-200 rounded' },
        e('div', { style:{ width:`${pct}%` }, className:'h-2 bg-sky-500 rounded' })
      )
    );
  }

  // Single question component (handles follow-up branching)
  function QuestionRow({ q, value, followUp, onChange, onFollowUpChange }) {
    if (q.type === 'text') {
      return e('div', { className:'mb-4' },
        e('label', { className:'block font-medium mb-1' }, q.label),
        e('input', {
          className:'w-full border p-2 rounded',
          value: value || '',
          onChange: (ev) => onChange(ev.target.value)
        })
      );
    }

    // likert slider
    const displayValue = q.reverse ? 100 - (value ?? 50) : (value ?? 50);
    return e('div', { className:'mb-6' },
      e('div', { className:'flex justify-between items-baseline' },
        e('label', { className:'font-medium' }, q.label),
        e('div', { className:'text-sm text-slate-600' }, `${Math.round(displayValue)}`)
      ),
      e('input', {
        type:'range',
        min:0, max:100, step:1,
        value: value ?? 50,
        onChange: (ev) => onChange(Number(ev.target.value)),
        className:'w-full'
      }),
      displayValue > 75 && e('div', { className:'mt-2' },
        e('label', { className:'text-sm text-slate-700 italic block mb-1' }, 'Follow-up example (probed because score > 75):'),
        e('textarea', {
          className:'w-full border p-2 rounded',
          rows:3,
          value: followUp || '',
          onChange: (ev) => onFollowUpChange(ev.target.value)
        })
      )
    );
  }

  function SectionCard({ section, responses, followUps, setResponses, setFollowUps, onNext, onPrev, canPrev }) {
    return e('section', { className:'bg-white p-6 rounded-2xl shadow mb-6' },
      e('h2', { className:'text-lg font-semibold mb-1' }, section.title),
      section.description && e('p', { className:'text-sm text-slate-600 mb-4' }, section.description),
      section.questions.map(q => {
        const value = responses[q.id];
        const fup = followUps[q.id];
        return e(QuestionRow, {
          key: q.id,
          q, value, followUp: fup,
          onChange: (v) => setResponses({ ...responses, [q.id]: v }),
          onFollowUpChange: (txt) => setFollowUps({ ...followUps, [q.id]: txt })
        });
      }),
      // Button row: Back + Next
      e('div', { className:'flex justify-between mt-2' },
        e('button', {
          onClick: onPrev,
          disabled: !canPrev,
          className: 'px-4 py-2 border rounded-md ' + (!canPrev ? 'opacity-50 cursor-not-allowed' : '')
        }, 'Back'),
        e('button', {
          onClick: onNext,
          className:'bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700'
        }, 'Next')
      )
    );
  }

  function LoginRegister({ onDone }) {
    const [mode, setMode] = useState('login'); // or 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [msg, setMsg] = useState('');

    async function handle() {
      setMsg('Working...');
      try {
        const path = mode === 'login' ? '/api/login' : '/api/register';
        const res = await fetch(buildUrl(path), {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, password, name })
        });
        const txt = await res.text();
        const j = txt ? JSON.parse(txt) : null;
        if (!res.ok) { setMsg(j?.error || txt || 'Error'); return; }
        storeToken(j.token, j.user);
        setMsg('Signed in');
        onDone();
      } catch (err) {
        setMsg(err.message || String(err));
      }
    }

    const onSubmit = (ev) => {
      ev.preventDefault(); // prevent page reload
      handle();
    };

    return e('form', { className:'bg-white p-6 rounded-2xl shadow mb-6', onSubmit, noValidate:true },
      e('h3', { className:'text-lg font-semibold mb-2' }, mode === 'login' ? 'Sign in' : 'Register'),
      e('div', null,
        e('label', { className:'block text-sm mb-1', htmlFor:'authEmail' }, 'Email'),
        e('input', {
          id:'authEmail', name:'email', type:'email', autoComplete:'email',
          className:'w-full border p-2 rounded mb-2',
          value:email, onChange: (ev)=>setEmail(ev.target.value)
        }),
        e('label', { className:'block text-sm mb-1', htmlFor:'authPassword' }, 'Password'),
        e('input', {
          id:'authPassword', name:'password', type:'password',
          autoComplete: mode === 'login' ? 'current-password' : 'new-password',
          className:'w-full border p-2 rounded mb-2',
          value:password, onChange: (ev)=>setPassword(ev.target.value)
        }),
        mode === 'register' && e('div', null,
          e('label', { className:'block text-sm mb-1', htmlFor:'authName' }, 'Full name (optional)'),
          e('input', {
            id:'authName', name:'name', autoComplete:'name',
            className:'w-full border p-2 rounded mb-2',
            value:name, onChange:(ev)=>setName(ev.target.value)
          })
        ),
        msg && e('div', { className:'mb-2 text-sm text-red-600' }, msg),
        e('div', { className:'flex gap-2' },
          e('button', { type:'submit', className:'bg-sky-600 text-white px-4 py-2 rounded' }, mode === 'login' ? 'Sign in' : 'Create account'),
          e('button', {
            type:'button',
            onClick: ()=> setMode(mode === 'login' ? 'register' : 'login'),
            className:'px-3 py-2 border rounded'
          }, mode === 'login' ? 'Create account' : 'Have an account? Sign in')
        )
      )
    );
  }

  // Summary / clinician report view (with PDF export)
  function SummaryCard({ responses, followUps, onEdit, onSubmit }) {
  // Helper: compute aggregates for a participant group
  function computeParticipantAggregates(responses, group) {
    const domains = { TP:[], BI:[], OE:[], LC:[], SC:[], PS:[] };
    SECTIONS.forEach(sec => {
      if ((group === 'self' && sec.id === 'self_role_fit') ||
          (group === 'coworker' && sec.id === 'coworker') ||
          (group === 'supervisor' && sec.id === 'supervisor')) {
        sec.questions.forEach(q => {
          if (q.domain && responses[q.id] !== undefined) {
            let v = Number(responses[q.id] || 0);
            if (q.reverse) v = 100 - v;
            domains[q.domain].push(v);
          }
        });
      }
    });
    const mean = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    return { TP: mean(domains.TP), BI: mean(domains.BI), OE: mean(domains.OE), LC: mean(domains.LC), SC: mean(domains.SC), PS: mean(domains.PS) };
  }

  // Compute aggregates and ROM for each group
  const selfAgg = computeParticipantAggregates(responses, 'self');
  const coworkerAgg = computeParticipantAggregates(responses, 'coworker');
  const supervisorAgg = computeParticipantAggregates(responses, 'supervisor');

  const selfROM = computeROM(selfAgg);
  const coworkerROM = computeROM(coworkerAgg);
  const supervisorROM = computeROM(supervisorAgg);

  // Combined / Overall
  const combinedAgg = {
    TP: Math.round((selfAgg.TP + coworkerAgg.TP + supervisorAgg.TP)/3),
    BI: Math.round((selfAgg.BI + coworkerAgg.BI + supervisorAgg.BI)/3),
    OE: Math.round((selfAgg.OE + coworkerAgg.OE + supervisorAgg.OE)/3),
    LC: Math.round((selfAgg.LC + coworkerAgg.LC + supervisorAgg.LC)/3),
    SC: Math.round((selfAgg.SC + coworkerAgg.SC + supervisorAgg.SC)/3),
    PS: Math.round((selfAgg.PS + coworkerAgg.PS + supervisorAgg.PS)/3),
  };
  const combinedROM = computeROM(combinedAgg);

  // Narrative lines
  const narrativeLines = [];
  narrativeLines.push(`Participant: ${responses.subject_name || '(unnamed)'} | Role: ${responses.role || 'N/A'}`);
  narrativeLines.push('--- Self-Report ---');
  narrativeLines.push(`Classification: ${selfROM.CLASSIFICATION} (Confidence ${selfROM.CONFIDENCE}%)`);
  narrativeLines.push(`IOS: ${selfROM.IOS} | EOS: ${selfROM.EOS}`);
  narrativeLines.push('--- Coworker Assessment ---');
  narrativeLines.push(`Classification: ${coworkerROM.CLASSIFICATION} (Confidence ${coworkerROM.CONFIDENCE}%)`);
  narrativeLines.push(`IOS: ${coworkerROM.IOS} | EOS: ${coworkerROM.EOS}`);
  narrativeLines.push('--- Supervisor Assessment ---');
  narrativeLines.push(`Classification: ${supervisorROM.CLASSIFICATION} (Confidence ${supervisorROM.CONFIDENCE}%)`);
  narrativeLines.push(`IOS: ${supervisorROM.IOS} | EOS: ${supervisorROM.EOS}`);
  narrativeLines.push('--- Combined / Overall ---');
  narrativeLines.push(`Classification: ${combinedROM.CLASSIFICATION} (Confidence ${combinedROM.CONFIDENCE}%)`);
  narrativeLines.push(`IOS: ${combinedROM.IOS} | EOS: ${combinedROM.EOS}`);

  const rawJSON = { responses, followUps, selfAgg, coworkerAgg, supervisorAgg, combinedAgg, selfROM, coworkerROM, supervisorROM, combinedROM };

  // Build printable report (no raw JSON; include readable aggregates for each group)
  function buildReportText() {
    const formatAggLine = (label, agg) =>
      `${label}: TP ${agg.TP}, BI ${agg.BI}, OE ${agg.OE}, LC ${agg.LC}, SC ${agg.SC}, PS ${agg.PS}`;

    const lines = [];
    lines.push('MDOA Solutions — Romanishan Reciprocity Assessment Report');
    lines.push(new Date().toLocaleString());
    lines.push('----------------------------------------');
    lines.push(`Participant: ${responses.subject_name || '(unnamed)'}`);
    lines.push(`Role: ${responses.role || 'N/A'}`);
    lines.push('');

    // Narrative summary per group
    lines.push('Summary');
    narrativeLines.forEach(l => lines.push('- ' + l));

    // Aggregates per group (textual)
    lines.push('');
    lines.push('Domain Aggregates (0–100)');
    lines.push(formatAggLine('Self report', selfAgg));
    lines.push(formatAggLine('Coworker assessment', coworkerAgg));
    lines.push(formatAggLine('Supervisor assessment', supervisorAgg));
    lines.push(formatAggLine('Combined / Overall', combinedAgg));

    // Follow-up notes (text only)
    lines.push('');
    lines.push('Follow-up notes');
    Object.keys(followUps || {}).forEach(k => {
      const qLabel = SECTIONS.flatMap(s => s.questions).find(q => q.id === k)?.label || k;
      lines.push(`${qLabel}: ${followUps[k] || '(none)'}`);
      // add a blank line between follow-up items
      lines.push('');
    });

    // Intentionally omit raw JSON from export
    return lines.join('\n');
  }

  // PDF export
  function exportPDF() {
    try {
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) { alert('PDF library not loaded.'); return; }

      const doc = new jsPDF({ unit:'pt', format:'letter' });
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = 14;

      let y = margin;

      // Header
      doc.setFontSize(14);
      doc.text('MDOA Solutions — Romanishan Reciprocity Assessment', margin, y);
      y += 20;

      // Body (paginated)
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(buildReportText(), maxWidth);
      for (const line of lines) {
        if (y + lineHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      }

      const name = (responses.subject_name || 'report').replace(/\s+/g,'_');
      doc.save(`${name}_romanishan_report.pdf`);
    } catch (err) { console.error(err); alert('PDF export failed: ' + err.message); }
  }

  return e('div', { className:'bg-white p-6 rounded-2xl shadow mb-6' },
    e('h2', { className:'text-xl font-semibold mb-2' }, 'Summary & Clinician Report'),
    e('div', { className:'mb-3 whitespace-pre-line text-sm text-slate-700' }, narrativeLines.join('\n')),
    e('div', { className:'mb-4' },
      e('div', { className:'text-sm text-slate-600 mb-1' }, 'Aggregated domain scores (Combined / Overall)'),
      e('div', { className:'grid grid-cols-3 gap-2 text-sm' },
        Object.entries(combinedAgg).map(([key, val]) =>
          e('div', { key, className:'p-2 bg-slate-50 rounded' },
            e('div', { className:'font-semibold' }, key),
            e('div', null, val)
          )
        )
      )
    ),
    e('div', { className:'flex gap-2 flex-wrap' },
      e('button', { onClick: exportPDF, className:'bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700' }, '📄 Download PDF'),
      e('button', { onClick: ()=> { const blob = new Blob([buildReportText()], { type:'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(responses.subject_name||'report').replace(/\s+/g,'_')}_report.txt`; a.click(); }, className:'bg-gray-200 px-4 py-2 rounded-md' }, 'Download TXT'),
      e('button', { onClick: ()=> onSubmit(rawJSON), className:'bg-sky-600 text-white px-4 py-2 rounded-md hover:bg-sky-700' }, 'Submit to backend'),
      e('button', { onClick: onEdit, className:'px-3 py-2 border rounded-md' }, 'Edit')
    )
  );
}


  // Admin tools component
  function AdminTools() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    async function loadRows() {
      setLoading(true);
      const res = await apiFetch('/api/list');
      setLoading(false);
      if (!res.ok) {
        alert('Failed to fetch: ' + (res.json?.error || res.error || res.text));
        return;
      }
      setRows(res.json || []);
    }

    useEffect(()=>{ loadRows(); }, []);

    return e('div', { className:'bg-white p-4 rounded-2xl shadow mt-4' },
      e('div', { className:'flex justify-between items-center mb-3' },
        e('h3', { className:'font-semibold' }, 'Admin — Recent assessments'),
        e('div', null,
          e('a', { className:'inline-block mr-2 bg-slate-200 px-3 py-1 rounded', href: buildUrl('/api/export-xlsx') }, 'Export Excel'),
          e('a', { className:'inline-block bg-slate-200 px-3 py-1 rounded', href: buildUrl('/api/export-csv') }, 'Export CSV')
        )
      ),
      loading && e('div', null, 'Loading...'),
      rows.map(r => e('div', { key:r.id, className:'border rounded p-3 mb-2' },
        e('div', { className:'flex justify-between' },
          e('div', null, e('strong', null, r.subject_name || '(unnamed)'), e('div', { className:'text-xs text-slate-500' }, new Date(r.timestamp).toLocaleString())),
          e('div', { className:'text-sm text-slate-600' }, `${Number(r.IOS).toFixed(1)} / ${Number(r.EOS).toFixed(1)} — ${r.CLASSIFICATION}`)
        ),
        e('details', null, e('summary', null, 'Raw'), e('pre', { className:'text-xs' }, r.raw_json || ''))
      ))
    );
  }

  // ---------- Main App ----------
  function AppRoot() {
    const [stage, setStage] = useState('intro'); // intro, login, section, summary, done
    const [user, setUser] = useState(loadUser());
    const [sectionIndex, setSectionIndex] = useState(0);
    const [responses, setResponses] = useState({});
    const [followUps, setFollowUps] = useState({});

    useEffect(()=> {
      // initialize minimal fields
      setResponses(r => ({ subject_name:'', role:'', context_short:'', ...r }));
    }, []);

    function startInterview() {
      setSectionIndex(0);
      setStage('section');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function nextSection() {
      if (sectionIndex < SECTIONS.length - 1) {
        setSectionIndex(sectionIndex + 1);
      } else {
        setStage('summary');
      }
      window.scrollTo({ top: 0, behavior:'smooth' });
    }

    // NEW: go back one section
    function prevSection() {
      if (sectionIndex > 0) {
        setSectionIndex(sectionIndex - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    function editResponses() {
      setStage('section');
      setSectionIndex(0);
      window.scrollTo({ top: 0, behavior:'smooth' });
    }

    async function handleSubmitToBackend({ agg, rom, responses, followUps }) {
      const payload = {
        subject_name: responses.subject_name || '(unnamed)',
        TP: agg.TP, BI: agg.BI, OE: agg.OE, LC: agg.LC, SC: agg.SC, PS: agg.PS,
        raw_json: JSON.stringify({ responses, followUps, agg, rom })
      };
      const res = await apiFetch('/api/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (res.ok) {
        alert('Assessment saved (id: ' + (res.json?.id || 'unknown') + ')');
        setStage('done');
      } else {
        if (res.status === 401) {
          const ok = confirm('Submission unauthorized. Sign in now?');
          if (ok) setStage('login');
        } else {
          alert('Save failed: ' + (res.json?.error || res.error || res.text));
        }
      }
    }

    function logout() { clearAuth(); setUser(null); }

    // compute aggregates for summary when needed
    function computeAggregates() {
      const domains = { TP:[], BI:[], OE:[], LC:[], SC:[], PS:[] };
      SECTIONS.forEach(sec => sec.questions.forEach(q => {
        if (q.domain && responses[q.id] !== undefined) {
          let v = Number(responses[q.id] || 0);
          if (q.reverse) v = 100 - v;
          domains[q.domain].push(v);
        }
      }));
      const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
      return { TP:avg(domains.TP), BI:avg(domains.BI), OE:avg(domains.OE), LC:avg(domains.LC), SC:avg(domains.SC), PS:avg(domains.PS) };
    }

    function computeParticipantAggregates(responses, group) {
      // group can be 'self_role_fit', 'coworker', 'supervisor'
      const domains = { TP:[], BI:[], OE:[], LC:[], SC:[], PS:[] };
      SECTIONS.forEach(sec => {
        if ((group === 'self' && sec.id === 'self_role_fit') ||
            (group === 'coworker' && sec.id === 'coworker') ||
            (group === 'supervisor' && sec.id === 'supervisor')) {
          sec.questions.forEach(q => {
            if (q.domain && responses[q.id] !== undefined) {
              let v = Number(responses[q.id] || 0);
              if (q.reverse) v = 100 - v;
              domains[q.domain].push(v);
            }
          });
        }
      });
      const mean = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
      return { TP: mean(domains.TP), BI: mean(domains.BI), OE: mean(domains.OE), LC: mean(domains.LC), SC: mean(domains.SC), PS: mean(domains.PS) };
    }

    return e('div', { className:'max-w-5xl mx-auto p-6' },
      e(Header, { user, onLogout: logout }),
      stage === 'intro' && e('div', null,
        e('div', { className:'bg-white p-6 rounded-2xl shadow mb-6' },
          e('h2', { className:'text-xl font-semibold mb-2' }, 'Guided Interview — Intake & Diagnostic'),
          e('p', { className:'text-sm text-slate-600 mb-4' }, 'This guided interview helps determine whether distress is primarily perceptual (individual) or environment-driven. Use follow-up probes for high scores (>75).'),
          e('div', { className:'flex gap-2' },
            e('button', { onClick: startInterview, className:'bg-sky-600 text-white px-4 py-2 rounded-md' }, 'Begin Interview'),
            e('button', { onClick: ()=> setStage('login'), className:'px-4 py-2 border rounded-md' }, 'Sign in / Register (optional)')
          )
        )
      ),
      stage === 'login' && e(LoginRegister, { onDone: ()=> { setUser(loadUser()); setStage('section'); } }),

      stage === 'section' && e('div', null,
        e(ProgressBar, { currentIndex: sectionIndex, total: SECTIONS.length }),
        e(SectionCard, {
          section: SECTIONS[sectionIndex],
          responses, followUps,
          setResponses, setFollowUps,
          onNext: nextSection,
          onPrev: prevSection,
          canPrev: sectionIndex > 0
        })
      ),

      stage === 'summary' && e(SummaryCard, { responses, followUps, onEdit: editResponses, onSubmit: handleSubmitToBackend }),

      stage === 'done' && e('div', { className:'bg-white p-6 rounded-2xl shadow mb-6' },
        e('h3', { className:'text-lg font-semibold mb-2' }, 'Assessment recorded'),
        e('p', { className:'text-sm text-slate-600 mb-4' }, 'The assessment has been saved. Use admin tools below to export data.'),
        e('button', { onClick: ()=> { setStage('intro'); setResponses({}); setFollowUps({}); }, className:'px-4 py-2 border rounded-md' }, 'Start new assessment')
      ),

      // Admin tools visible when signed in
      user && e(AdminTools),

      // small footer
      e('footer', { className:'text-xs text-slate-500 mt-6' }, 'MDOA Solutions — Romanishan Reciprocity Model')
    );
  }

  // mount
  const root = document.getElementById('root');
  if (!root) {
    console.error('No #root element found — put <div id="root"></div> in your index.html');
    return;
  }
  ReactDOM.createRoot(root).render(e(AppRoot));

})();
