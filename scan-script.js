// scan-script.js
// Enhanced Resilience Readiness Scan — 31 questions, 7 service domains, interpretation-driven drivers
document.addEventListener("DOMContentLoaded", () => {
  const calcBtn = document.getElementById("calcBtn");
  const scanModal = document.getElementById("scanModal");
  const scanModalBody = document.getElementById("scanModalBody");
  const modalClose = scanModal ? scanModal.querySelector(".modal-close") : null;
  const modalExportBtn = document.getElementById("modalExportBtn");
  const modalEmailBtn = document.getElementById("modalEmailBtn");

  // Safe getter for question inputs (1..31)
  function getQ(id) {
    const el = document.getElementById(`q${id}`);
    if (!el) return 3;
    const v = parseInt(el.value, 10);
    return (isNaN(v) ? 3 : Math.max(1, Math.min(5, v)));
  }

  // Modal open / close
  function openScanModal(html) {
    if (!scanModal) return;
    scanModalBody.innerHTML = html;
    scanModal.style.display = "block";
  }
  function closeScanModal() {
    if (!scanModal) return;
    scanModal.style.display = "none";
  }
  if (modalClose) modalClose.onclick = closeScanModal;
  window.onclick = e => { if (e.target === scanModal) closeScanModal(); };

  // Contradiction pairs and probe guidance
  const contradictionPairs = [
    [8,17], [6,19], [4,20], [15,18], [1,2]
  ];
  const probingMap = {
    "8-17":"You report transparent change communications but employees feel blindsided. Ask for a recent example of change communication and employee reaction.",
    "6-19":"Purpose-driven outcomes claimed without comparative improvement. Request metrics tied to purpose initiatives.",
    "4-20":"High perceived purpose but low KPIs. Ask for concrete retention/performance cases linked to mission.",
    "15-18":"Change outcomes claimed but fixes rely on 'work harder'. Request sustained KPI data from initiatives.",
    "1-2":"Alignment inconsistency — ask which departments miss strategic targets and why."
  };

  // -------- Per-question plain-language interpretation (1..31)
  // Index 0 unused to keep numeric indexing intuitive
  const qInterpret = {
    1: ["","Q1 (1): Teams do NOT understand how daily work maps to strategy — local optimization dominates.","Q1 (2): Teams lack clarity; alignment inconsistent.","Q1 (3): Mixed awareness — visibility gaps exist.","Q1 (4): Teams generally map work to strategy.","Q1 (5): Strong, consistent translation of strategy into daily activity."],
    2: ["","Q2 (1): Leadership decisions rarely cascade; implementation stalls.","Q2 (2): Cascade occasionally but slow due to bottlenecks.","Q2 (3): Cascade uneven — some decisions land, others don't.","Q2 (4): Decisions cascade quickly and are implemented.","Q2 (5): Rapid cascade and disciplined execution organization-wide."],
    3: ["","Q3 (1): Departments functionally siloed; duplication and rework common.","Q3 (2): Collaboration exists but duplication persists.","Q3 (3): Collaboration uneven; cross-team friction remains.","Q3 (4): Departments collaborate effectively with limited duplication.","Q3 (5): Seamless cross-functional collaboration and deconfliction."],
    4: ["","Q4 (1): Employees do NOT see purpose — motivation risk high.","Q4 (2): Purpose weak or inconsistently communicated.","Q4 (3): Purpose awareness mixed across roles.","Q4 (4): Employees generally perceive meaningful purpose.","Q4 (5): Purpose is embedded and drives behavior."],
    5: ["","Q5 (1): Rewards do not reinforce desired behaviors; signals misaligned.","Q5 (2): Recognition tokenistic and not behavior-shaping.","Q5 (3): Mixed effectiveness; incentives sometimes align.","Q5 (4): Rewards largely reinforce desired actions.","Q5 (5): Recognition strongly shapes culture and performance."],
    6: ["","Q6 (1): No evidence purpose improved outcomes — claims unsupported.","Q6 (2): Only anecdotal examples exist.","Q6 (3): Some examples but inconsistent measurement.","Q6 (4): Clear examples where purpose improved outcomes.","Q6 (5): Robust evidence showing repeatable performance gains tied to purpose."],
    7: ["","Q7 (1): Psychological safety low; blame culture present.","Q7 (2): Safety limited; some voices suppressed.","Q7 (3): Mixed safety across teams.","Q7 (4): Employees usually feel safe to speak up.","Q7 (5): Strong psychological safety and encouragement to experiment."],
    8: ["","Q8 (1): Leadership fails to communicate change; surprises common.","Q8 (2): Communication inconsistent or late.","Q8 (3): Some changes communicated well; others not.","Q8 (4): Leadership communicates with transparency and empathy.","Q8 (5): Outstanding change comms and stakeholder engagement."],
    9: ["","Q9 (1): Failures lead to blame, not learning.","Q9 (2): Occasional learning but not routine.","Q9 (3): Some root-cause analysis; inconsistent.","Q9 (4): Systemic learning is routine.","Q9 (5): Robust blameless learning and continuous improvement."],
    10:["","Q10 (1): Generational differences create conflict and lost knowledge.","Q10 (2): Friction evident; little integration.","Q10 (3): Mixed generational flow; gaps remain.","Q10 (4): Generational strengths leveraged.","Q10 (5): Generational integration is a strategic advantage."],
    11:["","Q11 (1): Comms channels rigid and exclude workstyles.","Q11 (2): Partial accommodation but many ignored.","Q11 (3): Adaptation inconsistent across org.","Q11 (4): Communication adapts to diverse styles.","Q11 (5): Systems flexibly serve all workstyles."],
    12:["","Q12 (1): New hires left to sink — no mentoring.","Q12 (2): Onboarding ad hoc and dependent on individuals.","Q12 (3): Some mentoring but not systematic.","Q12 (4): Mentoring and transfer programs effective.","Q12 (5): Institutionalized rapid integration and knowledge capture."],
    13:["","Q13 (1): Workflows/docs create friction — rework and delays.","Q13 (2): Docs inconsistent and outdated.","Q13 (3): Some workflows efficient; others not.","Q13 (4): Workflows usually reduce friction.","Q13 (5): Optimized workflows and docs reduce cognitive load."],
    14:["","Q14 (1): Hiring/retention failing — skill & culture fit issues.","Q14 (2): Recruitment retains some but departures persist.","Q14 (3): Mixed success; retention manager-dependent.","Q14 (4): Talent pipeline meets most needs.","Q14 (5): Strong attraction & retention aligned to needs."],
    15:["","Q15 (1): Change efforts produced no measurable improvement.","Q15 (2): Temporary KPI gains only.","Q15 (3): Some initiatives improved; others did not.","Q15 (4): Past initiatives show measurable sustained improvements.","Q15 (5): Consistent, measured change outcomes."],
    16:["","Q16 (1): Docs/controls obsolete or unused — compliance risk.","Q16 (2): Partial compliance; docs not trusted.","Q16 (3): Docs exist and used intermittently.","Q16 (4): Docs current and used daily.","Q16 (5): Docs authoritative and embedded in work."],
    17:["","Q17 (1): Rarely feel blindsided by leadership.","Q17 (2): Infrequent blindsiding.","Q17 (3): Mixed experiences regarding surprise.","Q17 (4): Employees often surprised.","Q17 (5): Frequent blindsiding — systemic comms breakdown."],
    18:["","Q18 (1): Problems SOLVED structurally, not by 'work harder'.","Q18 (2): 'Work harder' occasionally used as stopgap.","Q18 (3): Mix of systemic change and heroics.","Q18 (4): 'Work harder' often default.","Q18 (5): Heavy reliance on extra effort vs systemic fixes."],
    19:["","Q19 (1): Far less adaptable than 3 years ago.","Q19 (2): Adaptability weakened.","Q19 (3): Similar adaptability as 3 years ago.","Q19 (4): Noticeable improvement vs 3 years ago.","Q19 (5): Significant adaptability gains vs 3 years ago."],
    20:["","Q20 (1): No verifiable KPIs show resilience.","Q20 (2): KPIs limited or unreliable.","Q20 (3): Some KPIs exist but incomplete.","Q20 (4): KPIs show resilience in areas.","Q20 (5): Robust KPIs demonstrate resilience across disruptions."],
    // NEW Q21 - Q31
    21:["","Q21 (1): No data/behavioral insights used to anticipate problems.","Q21 (2): Limited analytics; mostly reactive.","Q21 (3): Some predictive use but not systematic.","Q21 (4): Data used to anticipate issues in some domains.","Q21 (5): Strong predictive systems integrated into operations."],
    22:["","Q22 (1): Leaders avoid data that challenge intuition.","Q22 (2): Partial resistance to evidence-based decisions.","Q22 (3): Mixed adoption of data-informed decision making.","Q22 (4): Leaders usually make evidence-informed choices.","Q22 (5): Leaders consistently use data to challenge norms."],
    23:["","Q23 (1): Systems ignore human limits; cognitive overload common.","Q23 (2): Ergonomic issues exist and cause errors.","Q23 (3): Some human-centered design, inconsistent application.","Q23 (4): Work design reduces overload most of the time.","Q23 (5): Work systems are designed tightly around human capability."],
    24:["","Q24 (1): Errors investigated systemically; blame rare.","Q24 (2): Systemic analysis occurs sometimes.","Q24 (3): Mixed approach to error investigation.","Q24 (4): Errors often prompt system-level review.","Q24 (5): Systemic root-cause analysis is routine."],
    25:["","Q25 (1): Cross-department workflows are unmapped and opaque.","Q25 (2): Some mapping exists but stale or incomplete.","Q25 (3): Workflows mapped but not routinely optimized.","Q25 (4): Workflows are visible and reviewed regularly.","Q25 (5): Cross-dept workflows are mapped, visible, and optimized."],
    26:["","Q26 (1): Digital and physical workflows are disconnected and fragmentary.","Q26 (2): Partial integration; handoffs break frequently.","Q26 (3): Integration exists but gaps remain.","Q26 (4): Digital/physical workflows integrated most places.","Q26 (5): Seamless integration of digital and physical flows."],
    27:["","Q27 (1): Critical docs are uncontrolled, inaccessible, and confusing.","Q27 (2): Versioning is inconsistent; trust low.","Q27 (3): Docs are accessible but maintenance uneven.","Q27 (4): Docs version-controlled and reliably accessible.","Q27 (5): Documents are authoritative, versioned, and trusted."],
    28:["","Q28 (1): Change initiatives ignore employee readiness and wellbeing.","Q28 (2): Some attention to readiness but inconsistent.","Q28 (3): Balance sometimes achieved; pacing uneven.","Q28 (4): Changes balance urgency and readiness appropriately.","Q28 (5): Change processes fully balance urgency with wellbeing."],
    29:["","Q29 (1): Approval processes lack structure — decisions made ad hoc with no accountability.","Q29 (2): Some approvals exist but role clarity and permissions are inconsistent.","Q29 (3): Processes defined but not always followed; accountability weak.","Q29 (4): Approval workflows function with mostly clear roles and permissions.","Q29 (5): Fully developed workflows with strict, auditable, role-based control and accountability."],
    30:["","Q30 (1): Employees frequently bypass document control, downloading files locally — major compliance risk.","Q30 (2): Occasional local downloads occur outside the system.","Q30 (3): Policy discourages local files but not fully enforced.","Q30 (4): Rare local downloads — most work stays in system.","Q30 (5): No off-system file activity — full compliance with controlled repository."],
    31:["","Q31 (1): Software systems and human workflows disconnected — multiple conflicting truths exist.","Q31 (2): Data handoffs and human coordination inconsistent; partial communication between systems.","Q31 (3): Systems communicate intermittently — partial integration.","Q31 (4): Systems and teams mostly aligned under shared source of truth.","Q31 (5): Seamless technical and human integration — unified single source of truth organization-wide."]
  };

  // ----- Pillar categories with new Qs included -----
  const categories = {
    alignment: [1,2,3,25,26,27,29,31],
    purpose: [4,5,6,26,27,28],
    adaptive: [7,8,9,22,23,24,28,30],
    generational: [10,11,12,23]
  };

  // ----- Service configuration (7 domains) -----
  // each service: qids, weights (same length), min/max weeks
  const serviceConfig = {
    orgdev: { name:"Organizational Development", qids:[1,2,3,4,11], weights:[0.22,0.18,0.18,0.24,0.18], minWeeks:6, maxWeeks:20 },
    humanFactors: { name:"Human Factors Engineering", qids:[7,8,9,13,16,23,24], weights:[0.20,0.16,0.14,0.12,0.12,0.14,0.12], minWeeks:4, maxWeeks:14 },
    talent: { name:"Talent Management", qids:[14,10,11,12,5], weights:[0.30,0.20,0.16,0.16,0.18], minWeeks:4, maxWeeks:12 },
    workflow: { name:"Engineering Workflow Management", qids:[13,25,26,1,2,3], weights:[0.30,0.22,0.18,0.10,0.10,0.10], minWeeks:4, maxWeeks:12 },
    docs: {name:"Document Management", qids:[16,27,13,3,20,29,30,31], weights:[0.18,0.12,0.12,0.10,0.10,0.12,0.13,0.13], minWeeks:3, maxWeeks:12 },
    change: { name:"Change Management", qids:[15,8,7,9,18,28], weights:[0.32,0.18,0.12,0.12,0.12,0.14], minWeeks:6, maxWeeks:20 },
    algoPsych: { name:"Algorithmic Psychology", qids:[21,22,6,14,19,20], weights:[0.30,0.20,0.16,0.12,0.12,0.10], minWeeks:4, maxWeeks:12 }
  };

  // convert answer to need value (1->1 need, 5->0 need)
  function needFromValue(v) { return (5 - v) / 4; }

  // compute service needs
  function computeServiceNeeds(values, contradictions, pillarScores, weakest) {
    const results = [];
    Object.keys(serviceConfig).forEach(key => {
      const cfg = serviceConfig[key];
      let raw = 0, totalW = 0;
      const drivers = [];
      cfg.qids.forEach((qid, idx) => {
        const w = cfg.weights[idx] || (1 / cfg.qids.length);
        totalW += w;
        const val = values[qid - 1] || 3;
        raw += w * needFromValue(val);
        const interp = qInterpret[qid] ? qInterpret[qid][val] : `Q${qid} (${val})`;
        drivers.push({ qid, val, interp });
      });
      raw = raw / totalW;

      // contradiction bump
      let contradictionBump = 0;
      contradictions.forEach(c => {
        if (cfg.qids.includes(c.pos) || cfg.qids.includes(c.inv)) {
          const gap = Math.abs((c.posVal || 3) - (c.invVal || 3));
          contradictionBump += 0.06 + Math.min(0.08, gap * 0.02);
        }
      });

      // weakest pillar bump
      let pillarBump = 0;
      const pillarServiceMap = {
        "Algorithmic Alignment":["orgdev","workflow","docs"],
        "Purpose Capital":["talent","algoPsych","orgdev"],
        "Adaptive Fear Reset":["change","humanFactors","workflow"],
        "Generational Flow Integration":["talent","orgdev"]
      };
      const weakestName = weakest && weakest[0];
      if (weakestName && pillarServiceMap[weakestName] && pillarServiceMap[weakestName].includes(key)) {
        pillarBump = 0.04;
      }

      let needScore = Math.min(1, raw + contradictionBump + pillarBump);
      const needPercent = Math.round(needScore * 100);
      const weeks = Math.max(cfg.minWeeks, Math.round(cfg.minWeeks + (cfg.maxWeeks - cfg.minWeeks) * needScore));
      const hourlyRate = 225; const weeklyHours = 30;
      const estCost = Math.round(weeks * hourlyRate * weeklyHours);

      // drivers: prefer low-valued items, else pick lowest three
      let driverHighlights = drivers.filter(d => d.val <= 3).sort((a,b)=>a.val-b.val).slice(0,4);
      if (driverHighlights.length === 0) driverHighlights = drivers.sort((a,b)=>a.val-b.val).slice(0,3);

      const severityLabel = needPercent >= 75 ? "High Urgency" : needPercent >= 50 ? "Moderate Need" : needPercent >= 30 ? "Tactical Improvement" : "Advisory";

      results.push({
        key, name: cfg.name, needPercent, needScore, weeks, estCost, drivers: driverHighlights, contradictionBump, pillarBump, severityLabel
      });
    });
    results.sort((a,b)=>b.needPercent - a.needPercent);
    return results;
  }

  // Main calculate
  function calculate() {
    const values = Array.from({length:31}, (_,i) => getQ(i+1));
    // pillar (category) scores
    function catScore(ids) { const sum = ids.reduce((a,qid)=>a + values[qid-1], 0); return Math.round((sum / (ids.length * 5)) * 100); }
    const alignScore = catScore(categories.alignment);
    const purposeScore = catScore(categories.purpose);
    const adaptiveScore = catScore(categories.adaptive);
    const genScore = catScore(categories.generational);
    const overall = Math.round((values.reduce((a,b)=>a+b,0) / (31 * 5)) * 100);

    // weakest pillar
    const pillarScores = {
      "Algorithmic Alignment": alignScore,
      "Purpose Capital": purposeScore,
      "Adaptive Fear Reset": adaptiveScore,
      "Generational Flow Integration": genScore
    };
    const weakest = Object.entries(pillarScores).sort((a,b)=>a[1]-b[1])[0];

    // contradictions
    const contradictions = [];
    contradictionPairs.forEach(([pos,inv])=>{
      const posVal = values[pos-1], invVal = values[inv-1];
      if ((posVal >= 4 && invVal >= 4) || (posVal >=4 && invVal <= 2)) {
        const key = `${pos}-${inv}`;
        contradictions.push({ key, pos, inv, posVal, invVal, probe: probingMap[key] || "" });
      }
    });

    // banding
    let scoreLabel, scoreDesc;
    if (overall < 40) { scoreLabel = "🔴 Fragile"; scoreDesc = "Immediate intervention recommended — full RWRM engagement."; }
    else if (overall < 55) { scoreLabel = "🟠 Recovering (Reactive)"; scoreDesc = "Reactive patterns present; targeted stabilization advised."; }
    else if (overall < 70) { scoreLabel = "🟡 Developing Resilience"; scoreDesc = "Resilience emerging; continue integration and targeted improvements."; }
    else { scoreLabel = "🟢 Resilient"; scoreDesc = "Solid resilience — focus on optimization and sustainment.";}

    // compute services
    const serviceResults = computeServiceNeeds(values, contradictions, pillarScores, weakest);

    // build modal HTML
    let html = `<h3>Resilience Index: <strong>${overall}%</strong> <span>${scoreLabel}</span></h3>`;
    html += `<p>${scoreDesc}</p>`;
    html += `<div class="scores-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem;">`;
    html += `<div class="score-card"><strong>Algorithmic Alignment</strong><div class="score-value">${alignScore}%</div></div>`;
    html += `<div class="score-card"><strong>Purpose Capital</strong><div class="score-value">${purposeScore}%</div></div>`;
    html += `<div class="score-card"><strong>Adaptive Fear Reset</strong><div class="score-value">${adaptiveScore}%</div></div>`;
    html += `<div class="score-card"><strong>Generational Flow</strong><div class="score-value">${genScore}%</div></div></div>`;

    html += `<p style="margin-top:1rem;"><strong>Weakest Pillar:</strong> ${weakest ? `${weakest[0]} (${weakest[1]}%)` : "N/A"}</p>`;

    // top 3 recommendations
    html += `<h4 style="margin-top:1rem;">Service Recommendations (Top 3)</h4>`;
    serviceResults.slice(0,3).forEach((s,idx)=>{
      html += `<div style="margin-bottom:0.6rem;padding:0.7rem;border-left:4px solid #004d80;background:#fff;">`;
      html += `<strong>${idx+1}. ${s.name}</strong> — <em>${s.needPercent}% need (${s.severityLabel})</em><br>`;
      html += `<small>Est. scope: ${s.weeks} weeks • Est. cost: $${s.estCost.toLocaleString()}</small>`;
      if (s.drivers && s.drivers.length) {
        html += `<div style="margin-top:0.5rem;"><strong>Key drivers — plain-language interpretation:</strong><ul style="margin:0.25rem 0 0 1rem;">`;
        s.drivers.forEach(d => html += `<li style="margin-bottom:0.25rem;">${d.interp}</li>`);
        html += `</ul></div>`;
      }
      if (s.contradictionBump > 0 || s.pillarBump > 0) {
        html += `<div style="margin-top:0.4rem;color:#8a2b2b;"><strong>Note:</strong> Contradictions or pillar weakness increased priority — validate during diagnostic.</div>`;
      }
      html += `</div>`;
    });

    if (contradictions.length) {
      html += `<div style="margin-top:1rem;padding:1rem;border-left:4px solid #c5a46d;background:#fff;">`;
      html += `<h4>Contradiction Flags</h4>`;
      contradictions.forEach(c => {
        html += `<div style="margin-bottom:0.6rem;"><strong>Q${c.pos}/Q${c.inv}</strong>: ${c.posVal}/${c.invVal}<br><em>${c.probe}</em></div>`;
      });
      html += `</div>`;
    } else {
      html += `<p style="margin-top:1rem;">No major contradiction flags detected.</p>`;
    }

    // expandable full question interpretations
    html += `<details style="margin-top:1rem;"><summary style="cursor:pointer;font-weight:700;">Full question interpretations (what your score indicates)</summary><div style="margin-top:0.8rem;">`;
    for (let i=1;i<=31;i++){
      const val = values[i-1];
      const interp = qInterpret[i] ? qInterpret[i][val] : `Q${i}: ${val}`;
      html += `<p style="margin:0.35rem 0;"><strong>Q${i} (${val}):</strong> ${interp}</p>`;
    }
    html += `</div></details>`;

    openScanModal(html);

    // prepare export payload
    const clientName = document.getElementById("clientName") ? document.getElementById("clientName").value : "Client";
    const consultDate = document.getElementById("scanDate") ? document.getElementById("scanDate").value : new Date().toLocaleDateString();

    if (modalExportBtn) {
      modalExportBtn.onclick = () => exportScanToPDF({ clientName, consultDate, overall, alignScore, purposeScore, adaptiveScore: adaptiveScore, genScore, weakest, contradictions, serviceResults, values });
    }
    if (modalEmailBtn) {
      modalEmailBtn.onclick = () => {
        const questionLines = values.map((v,i)=>`Q${i+1}: ${v} — ${qInterpret[i+1] ? qInterpret[i+1][v] : ""}`).join("\n");
        const topServices = serviceResults.slice(0,3).map(s => `${s.name}: ${s.needPercent}% need, ${s.weeks} weeks, $${s.estCost.toLocaleString()}`).join("\n");
        const body = encodeURIComponent(`Client: ${clientName}\nDate: ${consultDate}\n\nResilience Index: ${overall}%\nWeakest Pillar: ${weakest ? `${weakest[0]} (${weakest[1]}%)` : "N/A"}\n\nTop Recommendations:\n${topServices}\n\nContradictions:\n${contradictions.length ? contradictions.map(c=>`Q${c.pos}/Q${c.inv}: ${c.posVal}/${c.invVal} - ${c.probe}`).join("\n") : "None"}\n\nQuestion interpretations:\n${questionLines}`);
        window.location.href = `mailto:dr.wayneromanishan@mdoasolutions.com?subject=RRS Results - ${clientName}&body=${body}`;
      };
    }
  } // end calculate

  // Export to PDF (jsPDF)
  async function exportScanToPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    let y = 40;
    const left = 40;
    doc.setFontSize(18);
    doc.text("MDOA Solutions — Resilience Readiness Brief", left, y);
    y += 26;
    doc.setFontSize(12);
    doc.text(`Client: ${data.clientName}`, left, y); y += 14;
    doc.text(`Date: ${data.consultDate}`, left, y); y += 18;
    doc.text(`Resilience Index: ${data.overall}%`, left, y); y += 18;

    doc.text("Pillar Scores:", left, y); y += 14;
    const scores = [
      ["Algorithmic Alignment", data.alignScore],
      ["Purpose Capital", data.purposeScore],
      ["Adaptive Fear Reset", data.adaptiveScore],
      ["Generational Flow Integration", data.genScore]
    ];
    scores.forEach(s => { doc.text(`• ${s[0]}: ${s[1]}%`, left+12, y); y += 12; });
    y += 8;

    doc.text("Top Service Recommendations:", left, y); y += 14;
    data.serviceResults.slice(0,3).forEach(s => {
      const line = `${s.name} — ${s.needPercent}% need • ${s.weeks} weeks • $${s.estCost.toLocaleString()}`;
      const lines = doc.splitTextToSize(line, 480);
      doc.text(lines, left+12, y);
      y += lines.length * 12 + 6;
      if (s.drivers && s.drivers.length) {
        doc.text("Key drivers:", left+18, y); y += 12;
        s.drivers.forEach(d => {
          const drvLines = doc.splitTextToSize(`- ${d.interp}`, 460);
          doc.text(drvLines, left+24, y);
          y += drvLines.length * 12 + 4;
          if (y > 700) { doc.addPage(); y = 40; }
        });
      }
      if (y > 700) { doc.addPage(); y = 40; }
    });

    if (data.contradictions && data.contradictions.length) {
      doc.text("Contradictions & Suggested Probes:", left, y); y += 14;
      data.contradictions.forEach(c => {
        const text = `Q${c.pos}/Q${c.inv}: ${c.posVal}/${c.invVal} — ${c.probe || ""}`;
        const lines = doc.splitTextToSize(text, 480);
        doc.text(lines, left+12, y);
        y += lines.length * 12 + 6;
        if (y > 700) { doc.addPage(); y = 40; }
      });
      y += 6;
    }

    doc.text("Full question interpretations:", left, y); y += 14;
    for (let i=1;i<=31;i++) {
      const val = data.values ? data.values[i-1] : getQ(i);
      const interp = qInterpret[i] ? qInterpret[i][val] : `Q${i}: ${val}`;
      const lines = doc.splitTextToSize(`${i}. ${interp}`, 480);
      doc.text(lines, left+12, y);
      y += lines.length * 12 + 6;
      if (y > 700) { doc.addPage(); y = 40; }
    }

    const filename = `ResilienceBrief_${(data.clientName||"Client")}_${(data.consultDate||new Date().toLocaleDateString())}.pdf`.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    doc.save(filename);
  }

  // wire calc
  if (calcBtn) calcBtn.addEventListener("click", calculate);
}); // DOMContentLoaded end
