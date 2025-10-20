document.addEventListener("DOMContentLoaded", () => {
  // Hero title animation
  const headers = document.querySelectorAll(".hero--title");
  headers.forEach((header) => {
    const text = header.textContent.trim();
    header.innerHTML = "";
    text.split(" ").forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.style.display = "inline-flex";
      wordSpan.style.flexWrap = "nowrap";
      wordSpan.style.marginRight = "0.15em";
      word.split("").forEach((char, charIndex) => {
        const charSpan = document.createElement("span");
        charSpan.textContent = char;
        charSpan.style.animationDelay = `${(wordIndex * 5 + charIndex) * 0.1}s`;
        charSpan.style.display = "inline-block";
        wordSpan.appendChild(charSpan);
      });
      header.appendChild(wordSpan);
    });
  });

  // Export and email buttons
  const exportBtn = getElement("exportBtn");
  const emailBtn = getElement("emailBtn");
  addEventListenerSafe(exportBtn, "click", window.exportConsultationPdf);
  addEventListenerSafe(emailBtn, "click", window.sendConsultationEmail);

  // Reciprocity slider logic
  const reciprocity = getElement("reciprocity");
  const reciprocityScore = getElement("reciprocityScore");
  const reciprocityInterpretation = getElement("reciprocityInterpretation");

  if (reciprocity && reciprocityScore && reciprocityInterpretation) {
    function updateReciprocity() {
      const val = parseInt(reciprocity.value, 10);
      const percent = ((val - 1) / 4) * 100;
      let label, interpretation;

      if (percent < 35) {
        label = "Energy Deficit";
        interpretation = "Your current exchange indicates significant imbalance.";
      } else if (percent < 55) {
        label = "Emerging Awareness";
        interpretation = "A growing awareness of reciprocity gaps.";
      } else if (percent < 75) {
        label = "Developing Balance";
        interpretation = "Energy and recognition are increasingly aligned.";
      } else {
        label = "Reciprocal Synergy";
        interpretation = "Mutual reinforcement achieved.";
      }

      reciprocityScore.textContent = `Reciprocity Score: ${Math.round(percent)}% — ${label}`;
      reciprocityInterpretation.textContent = interpretation;
    }

    addEventListenerSafe(reciprocity, "input", updateReciprocity);
    updateReciprocity(); // Initialize
  }

  // Modal logic
  const modal = getElement("serviceModal");
  const closeBtn = modal ? modal.querySelector(".modal-close") : null;

  if (modal && closeBtn) {
    closeBtn.onclick = () => (modal.style.display = "none");
    window.onclick = (e) => {
      if (e.target === modal) modal.style.display = "none";
    };
  }

  // Sliders for RQ calculation
  const inputSlider = getElement("inputSlider");
  const returnSlider = getElement("returnSlider");
  const trustSlider = getElement("trustSlider");
  const selfRegSlider = getElement("selfRegSlider");

  if (inputSlider && returnSlider && trustSlider && selfRegSlider) {
    function refreshRangeDisplays() {
      getElement("inputVal").textContent = inputSlider.value;
      getElement("returnVal").textContent = returnSlider.value;
      getElement("trustVal").textContent = trustSlider.value;
      getElement("selfRegVal").textContent = selfRegSlider.value;
    }

    function updateUI() {
      refreshRangeDisplays();
      const inp = parseInt(inputSlider.value, 10);
      const ret = parseInt(returnSlider.value, 10);
      const tr = parseInt(trustSlider.value, 10);
      const sr = parseInt(selfRegSlider.value, 10);

      const raw = (ret * tr) / (inp * sr);
      const safeRaw = Math.max(raw, 0.000001);
      const norm = (Math.log(safeRaw) - Math.log(0.04)) / (Math.log(25) - Math.log(0.04));
      const percent = Math.round(Math.max(0, Math.min(1, norm)) * 100);

      const rqNumber = getElement("rqNumber");
      const rqTier = getElement("rqTier");
      const rqDesc = getElement("rqDesc");
      const gaugeNeedle = getElement("gaugeNeedle");

      if (rqNumber && rqTier && rqDesc && gaugeNeedle) {
        rqNumber.textContent = `${percent}%`;
        rqTier.textContent = percent < 40 ? "Under-Reciprocity" : percent < 55 ? "Reactive Reciprocity" : "Reciprocal Synergy";
        rqDesc.textContent = percent < 40 ? "Energy deficit detected." : "Healthy reciprocity achieved.";
        gaugeNeedle.style.transform = `rotate(${(percent / 100) * 180 - 90}deg)`;
      }
    }

    [inputSlider, returnSlider, trustSlider, selfRegSlider].forEach((slider) => {
      addEventListenerSafe(slider, "input", updateUI);
    });

    updateUI(); // Initialize
  }
});

// Helper function to safely get an element by ID
function getElement(id) {
  return document.getElementById(id);
}

// Helper function to safely add event listeners
function addEventListenerSafe(element, event, handler) {
  if (element) {
    element.addEventListener(event, handler);
  }
}

// ===== Service Data for Modals =====
const serviceData = {
  organizational: {
    title: "Organizational Development",
    problem: "Organizations struggle with misaligned goals, siloed teams, and outdated structures that can’t adapt to rapid change.",
    approach: "MDOA Solutions applies the Romanishan Workforce Resilience Model (RWRM) to align people, processes, and culture. Through diagnostics, leadership coaching, and resilience design, we identify where organizations are breaking down and rebuild with sustainable systems.",
    value: [
      "Increased adaptability to change",
      "Improved decision-making at all levels",
      "A culture where employees understand their role in the bigger picture"
    ],
    proof: "Rooted in doctoral research in Human & Organizational Psychology, we go beyond surveys. We solve the human + structural equation."
  },

  humanFactors: {
    title: "Human Factors Engineering",
    problem: "In high-stakes industries, small design flaws in workflows or environments lead to major human errors. Many organizations treat these as 'training issues' instead of systemic design flaws.",
    approach: "We use cognitive psychology and systems thinking to engineer environments where people succeed naturally. By reducing friction and designing workflows around human behavior, errors are minimized and productivity increases.",
    value: [
      "Reduced human errors and rework",
      "Safer, more efficient workplaces",
      "Workflows that align with human capabilities"
    ],
    proof: "Our doctorate-level integration of psychology and engineering positions MDOA uniquely to design systems where humans and processes work together seamlessly."
  },

  talent: {
    title: "Talent Management",
    problem: "Traditional HR focuses on filling roles, but ignores long-term engagement and generational alignment. This results in costly turnover and disengagement.",
    approach: "We apply algorithmic psychology to understand motivators across generations, then design systems that attract, engage, and retain top talent.",
    value: [
      "Lower turnover and hiring costs",
      "Stronger employee engagement",
      "Career pathways aligned with generational needs"
    ],
    proof: "Unlike survey-only HR firms, we use deep psychological models validated in academic research to solve workforce retention challenges."
  },

  workflow: {
    title: "Engineering Workflow Management",
    problem: "Engineering teams face bottlenecks, scope creep, and burnout—especially when cross-functional communication breaks down.",
    approach: "We analyze workflows through organizational psychology and systems engineering. Then we redesign processes with resilience in mind, ensuring smoother flow and reduced friction.",
    value: [
      "Faster project delivery",
      "Reduced costs through process efficiency",
      "Higher satisfaction among technical teams"
    ],
    proof: "As both an engineering workflow specialist and organizational psychologist, MDOA bridges two worlds most firms cannot."
  },

  documents: {
    title: "Document Management",
    problem: "Disorganized, siloed, and outdated documentation slows teams and creates compliance risks.",
    approach: "We assess current systems, design structured document workflows, and align them with human behavior, making compliance easy and intuitive.",
    value: [
      "Quick and easy access to information",
      "Reduced errors and redundancy",
      "Stronger compliance and audit readiness"
    ],
    proof: "Our solutions integrate cognitive psychology with workflow engineering, producing documentation systems that feel natural and resilient."
  },

  change: {
    title: "Change Management",
    problem: "Most change initiatives fail not because the change is wrong, but because the rollout ignores human psychology. Employees resist, costs rise, and leaders lose trust.",
    approach: "MDOA Solutions uses fear-reset strategies and social cognitive modeling to guide organizations through transitions. We help leaders communicate effectively and employees adapt faster.",
    value: [
      "Faster adoption of new systems",
      "Reduced resistance and hidden costs",
      "Stronger trust in leadership during change"
    ],
    proof: "Grounded in the RWRM model, we treat change as both a structural shift and a psychological journey."
  },

  algorithmic: {
    title: "Algorithmic Psychological Process Development",
    problem: "Organizations measure 'what' is happening with dashboards, but rarely understand 'why.' Without psychology, data insights remain shallow.",
    approach: "We design algorithmic psychology frameworks that merge behavioral science with data, translating human behavior into actionable insights for leaders.",
    value: [
      "Predict engagement and retention trends",
      "Understand root causes behind workforce challenges",
      "Build data systems that include human psychology"
    ],
    proof: "This is a new field pioneered by Dr. Wayne Romanishan Jr., Psy.D., bringing academic rigor into real-world workforce analytics."
  }
};

// ===== Modal Logic =====
function openModal(serviceKey) {
  const modal = document.getElementById("serviceModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalProblem = document.getElementById("modalProblem");
  const modalApproach = document.getElementById("modalApproach");
  const modalValue = document.getElementById("modalValue");
  const modalProof = document.getElementById("modalProof");

  const service = serviceData[serviceKey];
  modalTitle.textContent = service.title;
  modalProblem.textContent = service.problem;
  modalApproach.textContent = service.approach;

  // Build value list dynamically
  modalValue.innerHTML = "";
  service.value.forEach(val => {
    const li = document.createElement("li");
    li.textContent = val;
    modalValue.appendChild(li);
  });

  modalProof.textContent = service.proof;
  modal.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("serviceModal");
  const closeBtn = document.querySelector(".modal-close");

  // Only attach if modal and closeBtn exist on this page
  if (modal && closeBtn) {
    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };
  }

  // Fix: ensure modalEmailBtn event is attached after modal is shown
  function attachModalHandlers() {
    const modalEmailBtn = document.getElementById("modalEmailBtn");
    if (modalEmailBtn) {
      modalEmailBtn.onclick = function() {
        // ...your email logic here...
        // Example: window.location.href = "mailto:...";
      };
    }
    // ...attach other modal handlers if needed...
  }

  // If you open the modal dynamically, call attachModalHandlers() after showing modal
  // If modal is always present, call it once on DOMContentLoaded:
  attachModalHandlers();
});

function checkPassword() {
  const input = document.getElementById("passwordInput").value;
  const correctPassword = "WayneDoctorate2025"; // change to your own
  if (input === correctPassword) {
    document.querySelector(".locked").style.display = "none";
    document.getElementById("protectedContent").style.display = "block";
  } else {
    document.getElementById("errorMessage").style.display = "block";
  }
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 20;
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("Consultation Notes", 20, y);
  y += 12;

  // Capture client info
  const clientName = document.getElementById("clientName").value || "N/A";
  const consultDate = document.getElementById("consultDate").value || "N/A";

  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text(`Client: ${clientName}`, 20, y);
  y += 8;
  doc.text(`Date: ${consultDate}`, 20, y);
  y += 12;

  // Loop through all h2 sections and their related <li> + <textarea>
  document.querySelectorAll("h2").forEach(section => {
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text(section.textContent, 20, y);
    y += 10;

    const ul = section.nextElementSibling; // the <ul> right after <h2>
    if (ul && ul.tagName === "UL") {
      ul.querySelectorAll("li").forEach(li => {
        const questionText = li.childNodes[0].textContent.trim();
        const notes = li.querySelector("textarea").value || "(no notes)";

        // Question
        doc.setFont("times", "italic");
        let qLines = doc.splitTextToSize("Q: " + questionText, 170);
        doc.text(qLines, 20, y);
        y += qLines.length * 6;

        // Notes
        doc.setFont("times", "normal");
        let nLines = doc.splitTextToSize("Notes: " + notes, 170);
        doc.text(nLines, 20, y);
        y += nLines.length * 6 + 8;

        // Add page if near bottom
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }
  });

  // Save file with client name & date
  const fileName = `Consultation_${clientName || "Client"}_${consultDate || "Date"}.pdf`;
  doc.save(fileName);
}

document.addEventListener("DOMContentLoaded", () => {
  const jsPDF = window.jsPDF;
  const reciprocity = document.getElementById("reciprocity");
  const reciprocityScore = document.getElementById("reciprocityScore");
  const reciprocityInterpretation = document.getElementById("reciprocityInterpretation");

  // Function to calculate reciprocity score
  function updateReciprocity() {
    const val = parseInt(reciprocity.value);
    const percent = ((val - 1) / 4) * 100; // converts 1–5 to 0–100%
    let label, interpretation;

    if (percent < 35) {
      label = "Energy Deficit";
      interpretation = "Your current exchange indicates significant imbalance — you may be overextending without reciprocal reinforcement.";
    } else if (percent < 55) {
      label = "Emerging Awareness";
      interpretation = "A growing awareness of reciprocity gaps — ideal moment for leadership introspection and boundary recalibration.";
    } else if (percent < 75) {
      label = "Developing Balance";
      interpretation = "Energy and recognition are increasingly aligned — sustainable engagement within reach.";
    } else {
      label = "Reciprocal Synergy";
      interpretation = "Mutual reinforcement achieved — contributions and corporate support are in a dynamic equilibrium.";
    }

    reciprocityScore.textContent = `Reciprocity Score: ${Math.round(percent)}% — ${label}`;
    reciprocityInterpretation.textContent = interpretation;
    return { percent: Math.round(percent), label, interpretation };
  }

  reciprocity.addEventListener("input", updateReciprocity);
  updateReciprocity(); // initialize

  // Gather all form data
  function gatherData() {
    const r = updateReciprocity();
    return {
      org: document.getElementById("orgName").value,
      contact: document.getElementById("contactName").value,
      email: document.getElementById("contactEmail").value,
      phone: document.getElementById("contactPhone").value,
      domains: Array.from(document.getElementById("domains").selectedOptions).map(o=>o.value).join(", "),
      challenge: document.getElementById("challenge").value,
      outcome: document.getElementById("outcome").value,
      readiness: document.getElementById("readiness").value,
      alignment: document.getElementById("alignment").value,
      startDate: document.getElementById("startDate").value,
      reciprocityScore: r.percent,
      reciprocityLabel: r.label,
      reciprocityInterpretation: r.interpretation
    };
  }

  // Export to PDF
  document.getElementById("exportBtn").addEventListener("click", () => {
    const d = gatherData();
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    let y = 40;
    doc.setFontSize(16);
    doc.text("MDOA Solutions — Consultation Summary", 40, y);
    y += 24;
    doc.setFontSize(12);
    for (const [k,v] of Object.entries(d)) {
      const line = `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`;
      const lines = doc.splitTextToSize(line, 500);
      doc.text(lines, 40, y);
      y += lines.length * 14 + 6;
    }
    doc.save(`Consultation_${d.org || "client"}.pdf`);
  });

  // Email
  document.getElementById("emailBtn").addEventListener("click", () => {
    const d = gatherData();
    const body = encodeURIComponent(
      `Consultation Request\n\nOrganization: ${d.org}\nContact: ${d.contact}\nEmail: ${d.email}\nPhone: ${d.phone}\n\nDomains: ${d.domains}\nChallenge:\n${d.challenge}\n\nDesired Outcome:\n${d.outcome}\n\nLeadership Readiness: ${d.readiness}/5\nWorkforce Alignment: ${d.alignment}/5\nPreferred Start: ${d.startDate}\n\nReciprocity Score: ${d.reciprocityScore}% (${d.reciprocityLabel})\nInterpretation: ${d.reciprocityInterpretation}`
    );
    window.location.href = `mailto:dr.wayneromanishan@mdoasolutions.com?subject=MDOA Consultation Request&body=${body}`;
  });
});

// Use this for CDN/global jsPDF:
const jsPDF = window.jsPDF;

 // Level-1 RQ calculator logic
    document.addEventListener('DOMContentLoaded', () => {
      // DOM refs
      const inputSlider = document.getElementById('inputSlider');
      const returnSlider = document.getElementById('returnSlider');
      const trustSlider = document.getElementById('trustSlider');
      const selfRegSlider = document.getElementById('selfRegSlider');

      const inputVal = document.getElementById('inputVal');
      const returnVal = document.getElementById('returnVal');
      const trustVal = document.getElementById('trustVal');
      const selfRegVal = document.getElementById('selfRegVal');

      const gaugeNeedle = document.getElementById('gaugeNeedle');
      const rqNumber = document.getElementById('rqNumber');
      const rqTier = document.getElementById('rqTier');
      const rqDesc = document.getElementById('rqDesc');

      // Constants for normalization
      const minRaw = (1 * 1) / (5 * 5); // 0.04
      const maxRaw = (5 * 5) / (1 * 1); // 25

      // Update displayed numeric values
      function refreshRangeDisplays() {
        inputVal.textContent = inputSlider.value;
        returnVal.textContent = returnSlider.value;
        trustVal.textContent = trustSlider.value;
        selfRegVal.textContent = selfRegSlider.value;
      }

      // Compute RQ using log-normalization to compress scale
      function computeRQ() {
        const inp = parseInt(inputSlider.value, 10);
        const ret = parseInt(returnSlider.value, 10);
        const tr = parseInt(trustSlider.value, 10);
        const sr = parseInt(selfRegSlider.value, 10);

        // raw ratio
        const raw = (ret * tr) / (inp * sr);

        // guard: raw positive
        const safeRaw = Math.max(raw, 0.000001);

        // log normalize into 0-100
        const norm = (Math.log(safeRaw) - Math.log(minRaw)) / (Math.log(maxRaw) - Math.log(minRaw));
        let percent = Math.round(Math.max(0, Math.min(1, norm)) * 100);

        // Sometimes small rounding yields 0 or 100 exactly; keep 1-99 margins if extremal for nicer UX
        percent = Math.max(0, Math.min(100, percent));

        return { percent, raw, inp, ret, tr, sr };
      }

      function tierAndInterpretation(percent) {
        let tier = '', desc = '', color = '';
        if (percent < 40) {
          tier = '🔴 Under-Reciprocity';
          desc = 'Energy deficit detected — you may be giving more than you receive. This pattern increases risk for exhaustion and disengagement.';
          color = '#c0392b';
        } else if (percent < 55) {
          tier = '🟠 Reactive Reciprocity';
          desc = 'Awareness of imbalance exists, but reciprocity strategies are inconsistent. Targeted interventions (leadership, documentation, role clarity) are useful.';
          color = '#f39c12';
        } else if (percent < 70) {
          tier = '🟡 Developing Equilibrium';
          desc = 'Emerging balance — restored elements are present but fragile. Coaching and workflow fixes can convert this into durable stability.';
          color = '#f1c40f';
        } else if (percent < 85) {
          tier = '🟢 Reciprocal Synergy';
          desc = 'Healthy reciprocity — contributions are regularly met with restoration. Maintenance strategies and predictive monitoring recommended.';
          color = '#27ae60';
        } else {
          tier = '🔵 Regenerative Collaboration';
          desc = 'High reciprocity and regenerative dynamic — people and systems reinforce each other. Consider scaling and sustaining these practices.';
          color = '#1abc9c';
        }
        return { tier, desc, color };
      }

      // Update UI (gauge rotation, text)
      function updateUI() {
        refreshRangeDisplays();
        const { percent, raw, inp, ret, tr, sr } = computeRQ();
        const { tier, desc, color } = tierAndInterpretation(percent);

        rqNumber.textContent = percent + '%';
        rqTier.textContent = tier;
        rqDesc.textContent = desc;

        // Map percent (0..100) to angle (-90 .. +90)
        const angle = (percent / 100) * 180 - 90;
        gaugeNeedle.style.transform = `rotate(${angle}deg)`;
      }

      // Initial update
      updateUI();

      // Add listeners
      [inputSlider, returnSlider, trustSlider, selfRegSlider].forEach(s => s.addEventListener('input', updateUI));

      // Export summary to PDF
      document.getElementById('exportPdfBtn').addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'pt', format: 'letter' });
        const { percent, raw, inp, ret, tr, sr } = computeRQ();
        const { tier, desc } = tierAndInterpretation(percent);

        let y = 40;
        doc.setFontSize(18);
        doc.text("MDOA Solutions — Reciprocity Quotient Summary", 40, y);
        y += 28;
        doc.setFontSize(12);
        doc.text(`RQ: ${percent}% — ${tier}`, 40, y); y += 18;
        const lines = doc.splitTextToSize(desc, 480);
        doc.text(lines, 40, y); y += lines.length*14 + 8;

        doc.text("Profile Inputs:", 40, y); y += 16;
        doc.text(`• Perceived Input: ${inp} (1-5 scale)`, 50, y); y += 14;
        doc.text(`• Perceived Return: ${ret} (1-5 scale)`, 50, y); y += 14;
        doc.text(`• Systemic Trust: ${tr} (1-5 scale)`, 50, y); y += 14;
        doc.text(`• Self-Regulation: ${sr} (1-5 scale)`, 50, y); y += 18;

        doc.text("Interpretive Note:", 40, y); y += 16;
        const note = "This RQ is a reflective measure. A full professional diagnostic from MDOA is recommended for actionable remediation.";
        doc.text(doc.splitTextToSize(note, 500), 40, y);

        // Save with safe filename
        const filename = `RQ_Summary_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(filename);
      });

      // Email quick diagnostic (mailto)
      document.getElementById('emailBtn').addEventListener('click', () => {
        const { percent, raw, inp, ret, tr, sr } = computeRQ();
        const { tier, desc } = tierAndInterpretation(percent);

        const body = encodeURIComponent(
`Reciprocity Quotient Diagnostic Request

RQ: ${percent}%  —  ${tier}

Interpretation:
${desc}

Profile:
- Perceived Input: ${inp}
- Perceived Return: ${ret}
- Systemic Trust: ${tr}
- Self-Regulation: ${sr}

Please contact me to schedule a professional diagnostic and roadmap from MDOA Solutions.
`
        );

        // Open default mail client
        window.location.href = `mailto:dr.wayneromanishan@mdoasolutions.com?subject=RQ Diagnostic Request&body=${body}`;
      });

    });

    
    // Mapping question IDs to domain labels
    const domainMap = {
      "Organizational Development": [1,2,3,4],
      "Human Factors Engineering": [5,6,7,8],
      "Talent Management": [9,10,11,12],
      "Engineering Workflow Management": [13,14,15,16],
      "Document Management": [17,18,19,20],
      "Change Management": [21,22,23,24],
      "Algorithmic Psychology": [25,26,27,28]
    };

    // Utility: get value of q id
    function qVal(id) {
      const el = document.getElementById('q' + id);
      return el ? parseInt(el.value, 10) : 4;
    }

    // normalize 1-7 to 0-100 scale
    function normalizeScore(meanVal) {
      return Math.round(((meanVal - 1) / 6) * 100); // 1->0, 7->100
    }

    // compute domain results and ERQ
    function computeResults() {
      const domainResults = {};
      let sum = 0, count = 0;
      for (const [domain, qids] of Object.entries(domainMap)) {
        const vals = qids.map(q => qVal(q));
        const mean = vals.reduce((a,b)=>a+b,0) / vals.length;
        const score = normalizeScore(mean);
        domainResults[domain] = { mean, score, raw: vals };
        sum += score;
        count++;
      }
      const ERQ = Math.round(sum / count); // equal weights
      return { domainResults, ERQ };
    }

    // interpret ERQ ranges
    function interpretERQ(erq) {
      if (erq < 40) return { tier: "🔴 Energy Debt Zone", desc: "Severe under-reciprocity across multiple domains. Immediate intervention required to prevent systemic burnout." };
      if (erq < 60) return { tier: "🟠 Reactive Equilibrium", desc: "Oscillating reciprocity. Short-term measures may hide long-term instability. Targeted interventions recommended." };
      if (erq < 75) return { tier: "🟡 Developing Balance", desc: "Foundational reciprocity exists but key restoration mechanisms remain fragile. Focused optimization will scale resilience." };
      if (erq < 90) return { tier: "🟢 Reciprocal Synergy", desc: "Sustainable reciprocity overall; address local friction points to sustain growth." };
      return { tier: "🔵 Regenerative Organization", desc: "System-wide reciprocity and regeneration. Consider scaling and sustaining these practices." };
    }

    // Interpret domain with plain language based on score
    function interpretDomain(score) {
      if (score < 35) return { label: "High Risk", advice: "Critical remediation recommended (diagnostics, leadership stabilizing, immediate workflow fixes)."};
      if (score < 55) return { label: "At Risk", advice: "Targeted interventions required: clarify roles, fix handoffs, restore trust."};
      if (score < 70) return { label: "Developing", advice: "Short engagements (coaching + workflow) will yield measurable gains."};
      if (score < 85) return { label: "Healthy", advice: "Maintain and monitor; tighten measurement and predictive signals."};
      return { label: "Exemplary", advice: "Scale, codify, and share best practices across the enterprise."};
    }

    // Render domain heatmap & scores
    function renderResults() {
      const { domainResults, ERQ } = computeResults();
      const erqInterpret = interpretERQ(ERQ);

      document.getElementById('erqScore').textContent = ERQ + "%";
      document.getElementById('erqTier').textContent = erqInterpret.tier;
      document.getElementById('erqDesc').textContent = erqInterpret.desc;

      const container = document.getElementById('domainResults');
      container.innerHTML = '';
      for (const [domain, info] of Object.entries(domainResults)) {
        const domainDiv = document.createElement('div');
        const interp = interpretDomain(info.score);
        domainDiv.innerHTML = `
          <div style="margin-top:0.9rem;">
            <strong>${domain}</strong>
            <div class="domain-score"><div style="color:#333;font-weight:700;">${info.score}%</div><div style="color:#666;">${interp.label}</div></div>
            <div class="heatbar"><div class="heatfill" style="width:${info.score}%; background:${heatColor(info.score)}"></div></div>
            <div style="margin-top:0.4rem;color:#444;"><em>${interp.advice}</em></div>
          </div>
        `;
        container.appendChild(domainDiv);
      }
    }

    // color by score
    function heatColor(score) {
      if (score < 40) return '#c0392b';
      if (score < 60) return '#f39c12';
      if (score < 75) return '#f1c40f';
      if (score < 90) return '#27ae60';
      return '#1abc9c';
    }

    // copy summary to clipboard
    function buildSummaryText() {
      const { domainResults, ERQ } = computeResults();
      const lines = [];
      lines.push(`Enterprise Reciprocity Quotient (ERQ): ${ERQ}%`);
      lines.push('');
      for (const [domain, info] of Object.entries(domainResults)) {
        lines.push(`${domain}: ${info.score}% (raw: ${info.raw.join(', ')})`);
      }
      lines.push('');
      lines.push('Interpretation: ' + interpretERQ(ERQ).desc);
      return lines.join('\n');
    }

    // export pdf using jsPDF
    async function exportPDF() {
      const { jsPDF } = window.jspdf;
      const { domainResults, ERQ } = computeResults();
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      let y = 40;
      doc.setFontSize(18);
      doc.text("MDOA Solutions — Enterprise Reciprocity Diagnostic", 40, y);
      y += 26;
      doc.setFontSize(12);
      doc.text(`ERQ: ${ERQ}% — ${interpretERQ(ERQ).tier}`, 40, y); y += 18;
      doc.text(interpretERQ(ERQ).desc, 40, y); y += 18;
      y += 6;
      doc.setFontSize(13);
      doc.text("Domain Scores:", 40, y); y += 16;
      for (const [domain, info] of Object.entries(domainResults)) {
        const line = `${domain}: ${info.score}% — responses: ${info.raw.join(', ')}`;
        const lines = doc.splitTextToSize(line, 500);
        doc.text(lines, 40, y);
        y += lines.length * 14 + 6;
        if (y > 720) { doc.addPage(); y = 40; }
      }
      const filename = `ERD_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(filename);
    }

    // email results via mailto
    function emailResults() {
      const summary = buildSummaryText();
      const body = encodeURIComponent(summary + '\n\nPlease contact Dr. Wayne Romanishan Jr. for a full diagnostic and roadmap.');
      window.location.href = `mailto:dr.wayneromanishan@mdoasolutions.com?subject=ERD Diagnostic Results&body=${body}`;
    }

    // reset
    function resetNeutral() {
      for (let i=1;i<=28;i++){ const el=document.getElementById('q'+i); if(el) el.value=4; }
      renderResults();
    }

    // wire events
    document.getElementById('calcBtn').addEventListener('click', renderResults);
    document.getElementById('resetBtn').addEventListener('click', resetNeutral);
    document.getElementById('exportPdf').addEventListener('click', exportPDF);
    document.getElementById('emailResults').addEventListener('click', emailResults);
    document.getElementById('copySummary').addEventListener('click', () => {
      navigator.clipboard.writeText(buildSummaryText()).then(()=>alert('Summary copied to clipboard.'));
    });

    // initialize small UI: show default results at load
    window.addEventListener('load', () => { renderResults(); // attach input change updates for live feel
      for (let i=1;i<=28;i++){ const el=document.getElementById('q'+i); if(el) el.addEventListener('input', renderResults); }
    });

    (function(){
      const reciprocity = document.getElementById('reciprocity');
      const recPct = document.getElementById('reciprocityPercent');
      const recInterp = document.getElementById('reciprocityInterpretation');
      const exportBtn = document.getElementById('exportBtn');
      const emailBtn = document.getElementById('emailBtn');
      const form = document.getElementById('consultForm') || document.querySelector('form');

      // Map value (1..5) to percent and text
      function updateReciprocityUI() {
        const v = parseInt(reciprocity.value, 10);
        const pct = Math.round(((v - 1) / 4) * 100); // 1->0%, 5->100%
        recPct.textContent = pct + '%';
        let text = '';
        if (v <= 2) text = 'Energy deficit detected — organizational reciprocity is poor.';
        else if (v === 3) text = 'Developing balance — some areas are fair, others need work.';
        else if (v === 4) text = 'Balance largely intact — targeted improvements will optimize sustainability.';
        else text = 'Strong reciprocity — a regenerative environment is present.';
        recInterp.textContent = 'Reciprocity Score: ' + text;
      }
      reciprocity.addEventListener('input', updateReciprocityUI);
      updateReciprocityUI();

      // Export to PDF (one-page brief)
      async function exportPDF() {
        const { jsPDF } = window.jspdf || window.jspPDF || {};
        if (!jsPDF) {
          alert('PDF export is unavailable (jsPDF not loaded).');
          return;
        }
        const doc = new jsPDF({ unit: 'pt', format: 'letter' });
        let y = 38;
        const left = 40;
        doc.setFontSize(16);
        doc.text('MDOA Solutions — Consultation Request', left, y);
        y += 22;
        doc.setFontSize(11);
        doc.text('Organization: ' + (document.getElementById('orgName').value || '—'), left, y); y+=14;
        doc.text('Contact: ' + (document.getElementById('contactName').value || '—'), left, y); y+=14;
        doc.text('Email: ' + (document.getElementById('contactEmail').value || '—'), left, y); y+=14;
        doc.text('Phone: ' + (document.getElementById('contactPhone').value || '—'), left, y); y+=18;

        doc.text('Domains of Interest:', left, y); y+=12;
        const sel = Array.from(document.getElementById('domains').selectedOptions).map(o => o.textContent).join(', ') || '—';
        doc.text(sel, left + 12, y); y+=18;

        doc.text('Reciprocity (personal): ' + document.getElementById('reciprocityPercent').textContent, left, y); y+=18;

        doc.text('Challenge:', left, y); y+=12;
        const challenge = document.getElementById('challenge').value || '—';
        const lines = doc.splitTextToSize(challenge, 500);
        doc.text(lines, left+12, y);
        y += lines.length*12 + 10;

        doc.text('Desired Outcomes:', left, y); y+=12;
        const outcomes = document.getElementById('outcome').value || '—';
        const oLines = doc.splitTextToSize(outcomes, 500);
        doc.text(oLines, left+12, y);
        y += oLines.length*12 + 20;

        const fname = `MDOA_Consult_${(document.getElementById('orgName').value||'Client')}_${new Date().toISOString().slice(0,10)}.pdf`.replace(/[^a-zA-Z0-9_.-]/g,'_');
        doc.save(fname);
      }

      // Email results via mailto (populates body with summary)
      function emailResults() {
        const org = document.getElementById('orgName').value || '—';
        const name = document.getElementById('contactName').value || '—';
        const email = document.getElementById('contactEmail').value || '—';
        const phone = document.getElementById('contactPhone').value || '—';
        const sel = Array.from(document.getElementById('domains').selectedOptions).map(o => o.textContent).join(', ') || '—';
        const challenge = document.getElementById('challenge').value || '—';
        const outcomes = document.getElementById('outcome').value || '—';
        const rec = document.getElementById('reciprocityPercent').textContent || '—';
        let body = `Consultation request from ${name} at ${org}%0D%0A%0D%0A`;
        body += `Email: ${email}%0D%0APhone: ${phone}%0D%0A%0D%0A`;
        body += `Domains: ${sel}%0D%0A%0D%0A`;
        body += `Reciprocity (personal): ${rec}%0D%0A%0D%0A`;
        body += `Challenge:%0D%0A${encodeURIComponent(challenge)}%0D%0A%0D%0A`;
        body += `Desired outcomes:%0D%0A${encodeURIComponent(outcomes)}%0D%0A%0D%0A`;
        const mailto = `mailto:dr.wayneromanishan@mdoasolutions.com?subject=Consultation Request — ${encodeURIComponent(org)}&body=${body}`;
        window.location.href = mailto;
      }

      exportBtn.addEventListener('click', exportPDF);
      emailBtn.addEventListener('click', emailResults);

      // Lightweight validation: ensure required contact fields before PDF/email
      function requireContact() {
        const email = document.getElementById('contactEmail').value.trim();
        const name = document.getElementById('contactName').value.trim();
        const org = document.getElementById('orgName').value.trim();
        if (!email || !name || !org) {
          alert('Please provide Organization, Primary Contact, and Email before submitting.');
          return false;
        }
        return true;
      }
      exportBtn.addEventListener('click', (e) => { if (!requireContact()) e.stopImmediatePropagation(); });
      emailBtn.addEventListener('click', (e) => { if (!requireContact()) e.stopImmediatePropagation(); });

    })();

document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('exportBtn');
  const emailBtn = document.getElementById('emailBtn');
  const form = document.getElementById('consultForm');

  if (!form) return; // nothing to wire on pages without the form

  function gatherData() {
    const get = id => (document.getElementById(id) ? document.getElementById(id).value : '');
    const domainsEl = document.getElementById('domains');
    return {
      orgName: get('orgName'),
      contactName: get('contactName'),
      contactEmail: get('contactEmail'),
      contactPhone: get('contactPhone'),
      domains: domainsEl ? Array.from(domainsEl.selectedOptions).map(o => o.value).join(', ') : '',
      challenge: get('challenge'),
      outcome: get('outcome'),
      readiness: get('readiness'),
      alignment: get('alignment'),
      startDate: get('startDate'),
      reciprocity: get('reciprocity')
    };
  }

  function exportPdf() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      alert('PDF library not loaded.');
      return;
    }
    const data = gatherData();
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 48;
    doc.setFontSize(18);
    doc.text('Consultation Request', 48, y);
    y += 26;
    doc.setFontSize(11);

    const addLine = (label, value) => {
      const lines = doc.splitTextToSize(`${label}: ${value || ''}`, 500);
      doc.text(lines, 48, y);
      y += lines.length * 14 + 6;
      if (y > 740) { doc.addPage(); y = 48; }
    };

    addLine('Organization', data.orgName);
    addLine('Primary contact', data.contactName);
    addLine('Contact email', data.contactEmail);
    addLine('Contact phone', data.contactPhone);
    addLine('Domains', data.domains);
    addLine('Preferred start date', data.startDate);
    addLine('Readiness (1-5)', data.readiness);
    addLine('Alignment (1-5)', data.alignment);
    addLine('Reciprocity (1-5)', data.reciprocity);
    addLine('Main challenge / objective', data.challenge);
    addLine('Desired outcomes', data.outcome);

    doc.setFontSize(10);
    doc.text('Generated by MDOA Solutions', 48, doc.internal.pageSize.height - 40);
    const filename = (data.orgName ? data.orgName.replace(/\s+/g,'_') + '-' : '') + 'consultation-request.pdf';
    doc.save(filename);
  }

  function sendEmail() {
    const data = gatherData();
    const subject = `Consultation Request${data.orgName ? ' - ' + data.orgName : ''}`;
    const bodyLines = [
      `Organization: ${data.orgName}`,
      `Primary contact: ${data.contactName}`,
      `Email: ${data.contactEmail}`,
      `Phone: ${data.contactPhone}`,
      `Domains: ${data.domains}`,
      `Preferred start: ${data.startDate}`,
      `Readiness: ${data.readiness}`,
      `Alignment: ${data.alignment}`,
      `Reciprocity: ${data.reciprocity}`,
      '',
      `Main challenge / objective:`,
      data.challenge,
      '',
      `Desired outcomes:`,
      data.outcome
    ];
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = mailto;
  }

  // prevent duplicate handlers
  if (exportBtn) {
    exportBtn.removeEventListener('click', exportPdf);
    exportBtn.addEventListener('click', exportPdf);
  }
  if (emailBtn) {
    emailBtn.removeEventListener('click', sendEmail);
    emailBtn.addEventListener('click', sendEmail);
  }
});

document.addEventListener('DOMContentLoaded', () => {
	// Only wire consultation handlers if the form exists on the page
	const consultForm = document.getElementById('consultForm');
	if (!consultForm) return;

	const exportBtn = document.getElementById('exportBtn');
	const emailBtn = document.getElementById('emailBtn');

	// Helper: get element value safely
	const getVal = id => {
		const el = document.getElementById(id);
		if (!el) return '';
		if (el.tagName === 'SELECT' && el.multiple) {
			return Array.from(el.selectedOptions).map(o => o.value).join(', ');
		}
		return el.value || '';
	};

	function gatherConsultationData() {
		return {
			orgName: getVal('orgName'),
			contactName: getVal('contactName'),
			contactEmail: getVal('contactEmail'),
			contactPhone: getVal('contactPhone'),
			domains: getVal('domains'),
			challenge: getVal('challenge'),
			outcome: getVal('outcome'),
			readiness: getVal('readiness'),
			alignment: getVal('alignment'),
			startDate: getVal('startDate'),
			reciprocity: getVal('reciprocity')
		};
	}

	// Use existing global functions if present; otherwise define and expose them
	if (typeof window.exportConsultationPdf !== 'function') {
		window.exportConsultationPdf = function exportConsultationPdfFallback() {
			const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || (window.jspdf && window.jspdf.default) || null;
			if (!jsPDFCtor) {
				alert('PDF export failed: jsPDF library not found.');
				return;
			}
			const data = gatherConsultationData();
			const doc = new jsPDFCtor({ unit: 'pt', format: 'a4' });
			let y = 48;
			doc.setFontSize(18);
			doc.text('Consultation Request', 48, y);
			y += 28;
			doc.setFontSize(11);

			const addField = (label, value) => {
				const text = `${label}: ${value || ''}`;
				const lines = doc.splitTextToSize(text, 500);
				doc.text(lines, 48, y);
				y += lines.length * 14 + 8;
				if (y > 740) { doc.addPage(); y = 48; }
			};

			addField('Organization', data.orgName);
			addField('Primary contact', data.contactName);
			addField('Contact email', data.contactEmail);
			addField('Contact phone', data.contactPhone);
			addField('Domains', data.domains);
			addField('Preferred start date', data.startDate);
			addField('Readiness (1-5)', data.readiness);
			addField('Alignment (1-5)', data.alignment);
			addField('Reciprocity (1-5)', data.reciprocity);
			addField('Main challenge / objective', data.challenge);
			addField('Desired outcomes', data.outcome);

			doc.setFontSize(10);
			doc.text('Generated by MDOA Solutions', 48, doc.internal.pageSize.height - 40);

			const safeName = (data.orgName || 'consultation').trim().replace(/[^\w\-]+/g, '_');
			const filename = `${safeName}_consultation_request.pdf`;
			doc.save(filename);
		};
	}

	if (typeof window.sendConsultationEmail !== 'function') {
		window.sendConsultationEmail = function sendConsultationEmailFallback() {
			const data = gatherConsultationData();
			const subject = `Consultation Request${data.orgName ? ' - ' + data.orgName : ''}`;
			const lines = [
				`Organization: ${data.orgName}`,
				`Primary contact: ${data.contactName}`,
				`Email: ${data.contactEmail}`,
				`Phone: ${data.contactPhone}`,
				`Domains: ${data.domains}`,
				`Preferred start: ${data.startDate}`,
				`Readiness: ${data.readiness}`,
				`Alignment: ${data.alignment}`,
				`Reciprocity: ${data.reciprocity}`,
				'',
				'Main challenge / objective:',
				data.challenge,
				'',
				'Desired outcomes:',
				data.outcome
			];
			const body = encodeURIComponent(lines.join('\n'));
			const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
			try { window.location.href = mailto; } catch (err) { window.open(mailto, '_self'); }
		};
	}

	// Attach handlers by assigning the canonical function reference (avoids duplicate listeners)
	if (exportBtn) exportBtn.onclick = window.exportConsultationPdf;
	if (emailBtn) emailBtn.onclick = window.sendConsultationEmail;
});

// Service modal data and global modal open/close utilities
(function () {
  const serviceModalData = {
    organizational: {
      title: "Organizational Development",
      problem: "Misaligned day-to-day tasks, unclear ownership, and change introduced without system-level impact assessment cause friction and wasted effort.",
      approach: "We map strategy to operations, clarify roles and KPIs, and test changes with system-wide impact assessments and stakeholder validation.",
      value: [
        "Clear role-to-strategy alignment",
        "Reduced rework and faster decision cycles",
        "Change evaluated for system-wide impacts"
      ],
      proof: "Case studies show 25-40% reduction in process rework after alignment and governance interventions."
    },
    humanFactors: {
      title: "Human Factors Engineering",
      problem: "Tools and processes frequently ignore human cognitive limits, producing workarounds, errors, and low throughput.",
      approach: "We redesign interfaces and workflows around human capabilities, reduce interruptions, and simplify training pathways.",
      value: [
        "Lower error rates and faster onboarding",
        "Fewer workarounds and support tickets",
        "Higher sustained attention and throughput"
      ],
      proof: "Empirical reductions in error rates and support tickets observed in engineering teams after interface redesigns."
    },
    talent: {
      title: "Talent Management",
      problem: "Mismatch between hiring, career pathways, and retention incentives causes early attrition and hidden skill gaps.",
      approach: "We strengthen selection, design visible career paths, and calibrate recognition systems to replenish employee energy.",
      value: [
        "Improved retention of high performers",
        "Faster time-to-competence",
        "Targeted upskilling and mentorship"
      ],
      proof: "Clients report measurable improvements in retention and internal mobility after targeted talent interventions."
    },
    workflow: {
      title: "Engineering Workflow Management",
      problem: "Cross-team handoffs and scope creep lead to unpredictable delivery and technical debt.",
      approach: "We streamline handoffs, prioritize work to limit context switching, and introduce measurables for delivery predictability.",
      value: [
        "Predictable delivery cadence",
        "Reduced rework and technical debt",
        "Improved cross-team coordination"
      ],
      proof: "Improved lead time and lower defect rates following workflow optimizations."
    },
    documents: {
      title: "Document Management",
      problem: "Multiple repositories and uncontrolled copies cause compliance risk and wasted search time.",
      approach: "We establish single source-of-truth repositories, governance, and integrated human workflows.",
      value: [
        "One discoverable, versioned source-of-truth",
        "Fewer uncontrolled document copies",
        "Reliable audit and access controls"
      ],
      proof: "Organizations achieve faster discovery and lower compliance friction with governed doc systems."
    },
    change: {
      title: "Change Management",
      problem: "Poorly communicated change undermines trust and causes initiative failure.",
      approach: "We design change with measurable KPIs, stakeholder validation, coaching, and institutionalized learning.",
      value: [
        "Higher adoption and lower resistance",
        "Measurable outcomes from change programs",
        "Captured lessons and continuous improvement"
      ],
      proof: "Structured change programs show higher adoption and sustained outcomes versus ad-hoc approaches."
    },
    algorithmic: {
      title: "Algorithmic Psychology",
      problem: "People analytics can mislead when used without contextual and ethical calibration.",
      approach: "We apply human-centered, validated analytics to infer causes and design dignified interventions.",
      value: [
        "Ethical, contextualized analytics",
        "Early prevention of energy debt",
        "Actionable, respectful interventions"
      ],
      proof: "Validated models reduce false positives and preserve autonomy while enabling proactive interventions."
    }
  };

  // Expose close function globally to avoid scoping issues
  window.closeServiceModal = function closeServiceModal() {
    const modal = document.getElementById('serviceModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  };

  // Global openModal used by inline onclick attributes
  window.openModal = function openModal(key) {
    const data = serviceModalData[key];
    const modal = document.getElementById('serviceModal');
    if (!modal) {
      console.warn('serviceModal element not found');
      return;
    }
    // Populate fields (clear first)
    const titleEl = modal.querySelector('#modalTitle');
    const problemEl = modal.querySelector('#modalProblem');
    const approachEl = modal.querySelector('#modalApproach');
    const valueEl = modal.querySelector('#modalValue');
    const proofEl = modal.querySelector('#modalProof');

    if (!data) {
      titleEl.textContent = 'Service';
      problemEl.textContent = '';
      approachEl.textContent = '';
      valueEl.innerHTML = '';
      proofEl.textContent = '';
    } else {
      titleEl.textContent = data.title || '';
      problemEl.textContent = data.problem || '';
      approachEl.textContent = data.approach || '';
      valueEl.innerHTML = '';
      (data.value || []).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        valueEl.appendChild(li);
      });
      proofEl.textContent = data.proof || '';
    }

    // Show modal and prevent background scroll
    modal.classList.add('active');
    document.body.classList.add('modal-open');

    // Wire close button and overlay click (idempotent)
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.onclick = window.closeServiceModal;
    }
    // Clicking the overlay (outside modal-content) closes the modal
    modal.onclick = function (ev) {
      if (ev.target === modal) window.closeServiceModal();
    };

    // Esc to close
    const escHandler = function (ev) {
      if (ev.key === 'Escape') {
        window.closeServiceModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.removeEventListener('keydown', escHandler);
    document.addEventListener('keydown', escHandler);
  };

})();