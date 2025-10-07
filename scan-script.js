// scan-script.js
// Bias-resistant Resilience Readiness Scan logic
document.addEventListener("DOMContentLoaded", () => {
  const calcBtn = document.getElementById("calcBtn");
  const exportBtn = document.getElementById("exportBtn");
  const scanModal = document.getElementById("scanModal");
  const scanModalBody = document.getElementById("scanModalBody");
  const modalClose = scanModal.querySelector(".modal-close");

  // Mapping of questions to categories (indexes reflect q1...q20)
  const categories = {
    alignment: [1,2,3],        // q1-q3
    purpose: [4,5,6],          // q4-q6
    adaptive: [7,8,9],         // q7-q9
    generational: [10,11,12],  // q10-q12
    services: [13,14,15,16]    // q13-q16 (service indicators)
  };

  // Contradiction pairs: [positiveQuestionId, invertedQuestionId]
  // Example: leader transparency vs blindsided (q8 vs q17)
  const contradictionPairs = [
    [8, 17],   // q8 transparent leadership vs q17 blindsided
    [6, 19],   // q6 purpose evidence vs q19 improvement claim (belief vs comparative)
    [4, 20],   // q4 purpose belief vs q20 evidence of resilience
    [15, 18],  // q15 change outcome evidence vs q18 "work harder" fix
    [1, 2]     // small sanity check (alignment items compared)
  ];

  // Probing questions mapped to contradictions (key uses pair string)
  const probingMap = {
    "8-17": "You report both transparent change communication and employees feeling blindsided. Ask: 'Can you give a recent example where a change was communicated and how employees reacted? Who was informed first and why?'",
    "6-19": "You state purpose improves outcomes yet claim 'improvement vs 3yrs ago.' Ask: 'What specific purpose-driven initiative delivered measurable outcomes? Show me the metrics.'",
    "4-20": "High stated purpose but low evidence. Ask: 'When did employees last cite purpose as a reason to stay? Can we review retention cases tied to mission-related work?'",
    "15-18": "Change initiatives claimed to deliver impact, while fixes default to 'work harder.' Ask: 'Which changes had measurable KPIs and which relied on temporary heroics?'",
    "1-2": "If alignment items conflict, ask: 'Which departments consistently miss strategic targets and why? Who owns accountability?'"
  };

  function getQ(id) {
    const el = document.getElementById(`q${id}`);
    return el ? parseInt(el.value, 10) : 3;
  }

  // Modal open/close logic
  function openScanModal(html) {
    scanModalBody.innerHTML = html;
    scanModal.style.display = "block";
  }
  function closeScanModal() {
    scanModal.style.display = "none";
  }
  modalClose.onclick = closeScanModal;
  window.onclick = e => { if (e.target === scanModal) closeScanModal(); };

  // Calculation logic
  function calculate() {
    // Collect all 20 values
    const values = [];
    for (let i = 1; i <= 20; i++) values.push(getQ(i));

    // Compute category percentages
    function catScore(idArray) {
      const sum = idArray.reduce((acc, qid) => acc + values[qid - 1], 0);
      return Math.round((sum / (idArray.length * 5)) * 100);
    }

    const alignScore = catScore(categories.alignment);
    const purposeScore = catScore(categories.purpose);
    const adaptiveScore = catScore(categories.adaptive);
    const genScore = catScore(categories.generational);
    const servicesScore = catScore(categories.services);

    // overall
    const overall = Math.round((values.reduce((a,b)=>a+b,0) / (values.length * 5)) * 100);

    // Weakest pillar
    const pillarScores = {
      "Algorithmic Alignment": alignScore,
      "Purpose Capital": purposeScore,
      "Adaptive Fear Reset": adaptiveScore,
      "Generational Flow Integration": genScore
    };
    const weakest = Object.entries(pillarScores).sort((a,b)=>a[1]-b[1])[0];

    // Primary service need: check highest 'problem' indicators (lower score => need)
    // We'll invert service category (lower means more need) but use raw averages to determine which service area to propose
    const serviceValues = {
      workflow: values[12], // q13
      talent: values[13],   // q14
      change: values[14],   // q15
      docs: values[15]      // q16
    };
    // Lower value -> more need. So pick the minimal.
    const topNeedKey = Object.entries(serviceValues).sort((a,b)=>a[1]-b[1])[0][0];
    const serviceMap = {
      workflow: "Engineering Workflow Management",
      talent: "Talent Management",
      change: "Change Management",
      docs: "Document Management"
    };

    // Contradiction detection
    const contradictions = [];
    contradictionPairs.forEach(([pos, inv]) => {
      const posVal = values[pos - 1];
      const invVal = values[inv - 1];
      // If both high (>=4) or conflicting (pos>=4 && inv>=4) => possible contradiction
      // Also detect belief vs evidence: pos high (>=4) but evidence low (<=2)
      if (posVal >= 4 && invVal >= 4) {
        const key = `${pos}-${inv}`;
        contradictions.push({ key, pos, inv, posVal, invVal, probe: probingMap[key] || "" });
      }
      // belief vs evidence heuristics
      if ((pos === 6 && inv === 19) || (pos === 4 && inv === 20) || (pos === 15 && inv === 18)) {
        // pos is belief/evidence pair: if pos high and inv low -> optimism w/out evidence
        if (posVal >= 4 && invVal <= 2) {
          const key = `${pos}-${inv}`;
          contradictions.push({ key, pos, inv, posVal, invVal, probe: probingMap[key] || "" });
        }
      }
    });

    // Build result HTML
    let html = `<h3>Resilience Index: <strong>${overall}%</strong></h3>`;
    html += `<p>${overall < 40 ? '⚠️ <strong>At Risk</strong> — Immediate intervention recommended.' : (overall < 70 ? '<strong>Recovering</strong>: Some positive elements, but key misalignments remain.' : '✅ <strong>Resilient</strong> — Solid foundation; optimization recommended.') }</p>`;

    html += `<div class="scores-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem;">`;
    html += `<div class="score-card"><strong>Algorithmic Alignment</strong><div class="score-value">${alignScore}%</div></div>`;
    html += `<div class="score-card"><strong>Purpose Capital</strong><div class="score-value">${purposeScore}%</div></div>`;
    html += `<div class="score-card"><strong>Adaptive Fear Reset</strong><div class="score-value">${adaptiveScore}%</div></div>`;
    html += `<div class="score-card"><strong>Generational Flow</strong><div class="score-value">${genScore}%</div></div>`;
    html += `</div>`;

    html += `<p style="margin-top:1rem;"><strong>Weakest Pillar:</strong> ${weakest[0]} (${weakest[1]}%)</p>`;
    html += `<p><strong>Primary Service Recommendation:</strong> ${serviceMap[topNeedKey]}</p>`;

    if (contradictions.length) {
      html += `<div style="margin-top:1rem; padding:1rem; border-left:4px solid #c5a46d; background:#fff;">`;
      html += `<h4 style="margin:0 0 0.5rem 0;">Contradiction Flags</h4>`;
      contradictions.forEach(c => {
        html += `<div style="margin-bottom:0.6rem;"><strong>Pair:</strong> q${c.pos} / q${c.inv} — values: ${c.posVal} / ${c.invVal}<br>`;
        html += `<em>Suggested probe:</em> ${c.probe || 'Investigate this inconsistency during diagnostic.'}</div>`;
      });
      html += `</div>`;
    } else {
      html += `<p style="margin-top:1rem;">No major contradiction flags detected.</p>`;
    }

    openScanModal(html);

    // Attach export and email handlers inside modal
    document.getElementById("modalExportBtn").onclick = () => exportScanToPDF({
      clientName: document.getElementById("clientName").value || "Client",
      consultDate: document.getElementById("scanDate").value || new Date().toLocaleDateString(),
      overall, alignScore, purposeScore, adaptiveScore, genScore, servicesScore, weakest, contradictions, serviceRecommendation: serviceMap[topNeedKey]
    });

    document.getElementById("modalEmailBtn").onclick = () => {
      // Gather all question values
      let questions = [];
      for (let i = 1; i <= 20; i++) {
        const el = document.getElementById(`q${i}`);
        questions.push(`Q${i}: ${el ? el.value : "N/A"}`);
      }
      // Build email body
      const body = encodeURIComponent(
        `Client: ${document.getElementById("clientName").value || "Client"}\n` +
        `Date: ${document.getElementById("scanDate").value || new Date().toLocaleDateString()}\n\n` +
        `Resilience Index: ${overall}%\n` +
        `Algorithmic Alignment: ${alignScore}%\n` +
        `Purpose Capital: ${purposeScore}%\n` +
        `Adaptive Fear Reset: ${adaptiveScore}%\n` +
        `Generational Flow: ${genScore}%\n` +
        `Primary Service Recommendation: ${serviceMap[topNeedKey]}\n\n` +
        `Weakest Pillar: ${weakest[0]} (${weakest[1]}%)\n\n` +
        `Contradictions:\n${contradictions.length ? contradictions.map(c => `q${c.pos}/q${c.inv}: ${c.posVal}/${c.invVal} - ${c.probe}`).join('\n') : "None"}\n\n` +
        `Question Responses:\n${questions.join('\n')}`
      );
      window.location.href =
        `mailto:dr.wayneromanishan@mdoasolutions.com?subject=Resilience Scan Diagnostic Review&body=${body}`;
    };
  }

  // Export using jsPDF
  async function exportScanToPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    let y = 40;
    doc.setFontSize(18);
    doc.text("MDOA Solutions — Resilience Readiness Brief", 40, y);
    y += 26;
    doc.setFontSize(12);
    doc.text(`Client: ${data.clientName}`, 40, y); y += 14;
    doc.text(`Date: ${data.consultDate}`, 40, y); y += 18;
    doc.text(`Resilience Index: ${data.overall}%`, 40, y); y += 18;

    // scores
    doc.setFontSize(12);
    doc.text("Pillar Scores:", 40, y); y += 14;
    const scores = [
      ["Algorithmic Alignment", data.alignScore],
      ["Purpose Capital", data.purposeScore],
      ["Adaptive Fear Reset", data.adaptiveScore],
      ["Generational Flow Integration", data.genScore]
    ];
    scores.forEach(s => {
      doc.text(`• ${s[0]}: ${s[1]}%`, 50, y); y += 12;
    });
    y += 8;

    doc.text(`Primary Service Recommendation: ${data.serviceRecommendation}`, 40, y); y += 18;

    // contradictions
    if (data.contradictions && data.contradictions.length) {
      doc.setFontSize(12);
      doc.text("Contradiction Flags & Suggested Probes:", 40, y); y += 14;
      data.contradictions.forEach(c => {
        const text = `q${c.pos}/q${c.inv} — values ${c.posVal}/${c.invVal}. Probe: ${c.probe || 'Investigate inconsistency.'}`;
        const lines = doc.splitTextToSize(text, 480);
        doc.text(lines, 45, y);
        y += lines.length * 12 + 6;
        if (y > 700) { doc.addPage(); y = 40; }
      });
    } else {
      doc.text("No contradictions detected.", 40, y); y += 16;
    }

    // Suggested next steps (short)
    y += 8;
    doc.text("Suggested Next Steps:", 40, y); y += 14;
    const steps = [
      "1) Schedule a 60-min diagnostic with Dr. Wayne to validate contradictions.",
      "2) Run focused diagnostics (interviews, pulse-checks, workflow audit).",
      "3) Deliver prioritized roadmap with cost & timeline estimates."
    ];
    steps.forEach(s => { const lines = doc.splitTextToSize(s, 500); doc.text(lines, 45, y); y += lines.length * 12 + 6; if (y > 700) { doc.addPage(); y = 40; } });

    // Save
    const filename = `ResilienceBrief_${data.clientName}_${data.consultDate}.pdf`.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    doc.save(filename);
  }

  // Button listeners
  calcBtn.addEventListener("click", calculate);

  exportBtn.addEventListener("click", () => {
    calculate();
    // Export handled in modal
  });
});