// reciprocity-diagnostic.js
// Level 2 UX: subtle energy meter, narratives, micro-recommendations, archetype labeling
// MDOA Solutions — Dr. Wayne Romanishan

(function(){ // IIFE to avoid globals
  function $(id){ return document.getElementById(id); }
  function qVal(id, fallback=4){
    const el = $(id);
    if(!el) return fallback;
    const v = parseInt(el.value,10);
    return isNaN(v)? fallback : Math.max(1, Math.min(7, v));
  }

  // Domain mapping
  const domains = {
    "Organizational Development": [1,2,3,4],
    "Human Factors Engineering": [5,6,7,8],
    "Talent Management": [9,10,11,12],
    "Engineering Workflow Management": [13,14,15,16],
    "Document Management": [17,18,19,20],
    "Change Management": [21,22,23,24],
    "Algorithmic Psychology": [25,26,27,28]
  };

  // Tier narratives (organizational voice)
  const tierNarratives = {
    "Depleted Reciprocity": "Your organization is likely expending more energy than it restores. Systems, incentives, or leadership behaviors are draining workforce capacity. Immediate diagnostic follow-up is recommended.",
    "Reactive Reciprocity": "Exchange loops exist but rely on short-term emotional or motivational debt. Address structural drivers and measurement to avoid slippage into depletion.",
    "Balanced Reciprocity": "Energy exchange is mostly sustainable; focus on targeted optimization to solidify resilient patterns across domains.",
    "Regenerative Reciprocity": "Systems and culture replenish energy at scale. Next steps are sustainment, predictive monitoring, and scaled measurement."
  };

  // Domain micro recommendations (short)
  const domainAdvice = {
    "Organizational Development": "Clarify decision ownership, cascade mechanisms, and simple visual maps tying daily work to strategic KPIs.",
    "Human Factors Engineering": "Treat repeated errors as systemic signals; reduce cognitive load and better instrument handoffs and interfaces.",
    "Talent Management": "Strengthen career path visibility, tailored incentives, and early-warning retention signals.",
    "Engineering Workflow Management": "Map cross-team handoffs and enforce small experiment cycles to remove recurrent friction.",
    "Document Management": "Establish a single source of truth, role-based access controls and automated versioning to reduce knowledge loss.",
    "Change Management": "Design for human readiness—use pilots, measure adoption, and protect energy during transitions.",
    "Algorithmic Psychology": "Use ethical, validated signals to predict risk and tailor interventions—avoid reifying metrics without human context."
  };

  // Archetype mapping — simple rules to label the org
  function deriveArchetype(domainScores){
    // pick the highest scoring domain, and the lowest — produce archetype
    const entries = Object.entries(domainScores);
    const sorted = entries.slice().sort((a,b)=>b[1]-a[1]);
    const top = sorted[0][0];
    const low = sorted[sorted.length-1][0];

    // simple archetype names based on patterns (customize as you like)
    if (top === "Algorithmic Psychology" && low !== top) return "The Data Steward";
    if (top === "Organizational Development") return "The Architect";
    if (top === "Human Factors Engineering") return "The Empathic System";
    if (top === "Engineering Workflow Management") return "The Flow Keeper";
    if (top === "Talent Management") return "The People Builder";
    if (top === "Document Management") return "The Custodian";
    if (top === "Change Management") return "The Transformer";
    return "The Pragmatist";
  }

  // domain interpretation bands
  function interpretDomain(score){
    if (score < 40) return { msg: "Severe imbalance — immediate diagnostic required.", color:"#b71c1c" };
    if (score < 60) return { msg: "Recovering — moderate reciprocity gaps observed.", color:"#ef6c00" };
    if (score < 80) return { msg: "Stable — reciprocity generally healthy but improvable.", color:"#fbc02d" };
    return { msg: "Regenerative — domain practices are reinforcing energy flow.", color:"#2e7d32" };
  }

  // interpret tier by ERQ numeric
  function interpretERQ(erq){
    if (erq < 50) return { tier: "Depleted Reciprocity", desc: tierNarratives["Depleted Reciprocity"] };
    if (erq < 65) return { tier: "Reactive Reciprocity", desc: tierNarratives["Reactive Reciprocity"] };
    if (erq < 80) return { tier: "Balanced Reciprocity", desc: tierNarratives["Balanced Reciprocity"] };
    return { tier: "Regenerative Reciprocity", desc: tierNarratives["Regenerative Reciprocity"] };
  }

  // subtle energy meter (SVG) animator
  function createOrUpdateEnergyMeter(container, erq){
    // container is an element; we ensure an SVG is present and animate stroke + color
    if(!container) return;
    let svg = container.querySelector("svg.energy-meter");
    if(!svg){
      svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
      svg.setAttribute("class","energy-meter");
      svg.setAttribute("viewBox","0 0 100 100");
      svg.innerHTML = `
        <defs>
          <linearGradient id="emGrad" x1="0%" x2="100%">
            <stop offset="0%" stop-color="#c5a46d"/>
            <stop offset="100%" stop-color="#004d80"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="36" stroke="#eee" stroke-width="8" fill="none"></circle>
        <circle cx="50" cy="50" r="36" stroke="url(#emGrad)" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="226.2" stroke-dashoffset="226.2" transform="rotate(-90 50 50)"></circle>
        <text x="50" y="54" text-anchor="middle" font-size="16" font-weight="700" fill="#0b2545" class="em-text">—</text>
      `;
      container.appendChild(svg);
    }
    const arc = svg.querySelectorAll("circle")[1];
    const text = svg.querySelector(".em-text");
    // convert erq 0..100 to dashoffset: 226.2 total circumference for r=36 => 2πr = ~226.194
    const circ = 2 * Math.PI * 36;
    const targetOffset = circ * (1 - (erq / 100));
    // animate using requestAnimationFrame
    let start = null;
    const initial = parseFloat(arc.getAttribute("data-offset") || circ);
    const duration = 700;
    function step(ts){
      if (!start) start = ts;
      const t = Math.min(1,(ts - start)/duration);
      const ease = t<.5 ? 2*t*t : -1 + (4 - 2*t)*t; // easeInOutQuad-ish
      const current = initial + (targetOffset - initial) * ease;
      arc.setAttribute("stroke-dashoffset", current);
      arc.setAttribute("data-offset", current);
      if (text) text.textContent = `${Math.round(erq)}%`;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    // color shift by ERQ (more green when higher)
    const gradStops = svg.querySelectorAll("#emGrad stop");
    if (gradStops && gradStops.length >= 2){
      // blend color roughly
      const g = Math.round( (erq/100) * 46 + ((100-erq)/100) * 197 ); // crude blend for demo
      gradStops[0].setAttribute("stop-color", erq>65 ? "#8bc34a" : "#c5a46d");
      gradStops[1].setAttribute("stop-color", erq>65 ? "#1b5e20" : "#004d80");
    }
  }

  // Render a numeric scale under each range input and position ticks to match slider divisions
  function renderSliderScales() {
    const qRows = document.querySelectorAll(".q-row");
    qRows.forEach(row => {
      const range = row.querySelector('input[type="range"]');
      if (!range) return;

      // Ensure single scale container
      let scale = row.querySelector(".slider-scale");
      if (!scale) {
        scale = document.createElement("div");
        scale.className = "slider-scale";
        row.appendChild(scale);
      }

      const min = Number(range.min) || 1;
      const max = Number(range.max) || 7;
      const steps = Math.max(1, max - min);

      // Build ticks using percentages so 0%..100% map across the inset container
      function buildTicks() {
        scale.innerHTML = "";
        for (let i = min; i <= max; i++) {
          const span = document.createElement("span");
          span.textContent = String(i);
          const frac = (i - min) / steps; // 0..1
          span.style.left = (frac * 100) + "%"; // set percent position
          scale.appendChild(span);
        }
      }

      const updateActive = () => {
        const val = Math.round(Number(range.value));
        scale.querySelectorAll("span").forEach(s => {
          s.classList.toggle("active", Number(s.textContent) === val);
        });
      };

      // Build and wire events
      buildTicks();
      updateActive();
      range.addEventListener("input", updateActive);
      range.addEventListener("change", updateActive);

      // Rebuild on resize to keep positions accurate relative to inset container
      const onResize = () => { buildTicks(); updateActive(); };
      window.addEventListener("resize", onResize);
      // (optional) store reference if you later need to remove listener
    });
  }

  // Build modal content + animation flow (uses existing modal structure in HTML)
  function openModalWithReveal(domainScores, ERQ){
    const overlay = $("interpretiveModal");
    if(!overlay) { console.error("Modal element not found (#interpretiveModal)"); return; }
    const modalContent = overlay.querySelector(".modal-content");
    const modalResults = $("modalResults");
    const narrativeText = $("narrativeText");
    const canvas = $("erqChart");
    // archetype
    const archetype = deriveArchetype(domainScores);

    // basic content for modalResults
    let topHtml = `<div style="display:flex;gap:1rem;align-items:center;justify-content:center;">`;
    topHtml += `<div id="energyWrap" style="width:92px;height:92px;"></div>`;
    topHtml += `<div style="text-align:left;">`;
    topHtml += `<div style="font-size:1.8rem;font-weight:800;color:#0b2545;">${ERQ}%</div>`;
    topHtml += `<div style="font-weight:700;color:#004d80;margin-top:.25rem;">${interpretERQ(ERQ).tier} • ${archetype}</div>`;
    topHtml += `<div style="max-width:560px;margin-top:.5rem;color:#555;">${interpretERQ(ERQ).desc}</div>`;
    topHtml += `</div></div><hr style="margin:1rem 0;">`;

    // domain mini-blocks (initially empty; will animate in)
    topHtml += `<div id="domainSummaryGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.6rem;"></div>`;
    modalResults.innerHTML = topHtml;

    // make overlay visible
    overlay.style.display = "flex";
    overlay.classList.add("active");
    modalContent.classList.add("reveal");

    // update energy meter
    const energyWrap = $("energyWrap");
    createOrUpdateEnergyMeter(energyWrap, ERQ);

    // gradually fill domain grid
    const grid = $("domainSummaryGrid");
    const keys = Object.keys(domainScores);
    let i = 0;
    const interval = setInterval(()=>{
      if(i>=keys.length){ clearInterval(interval); drawRadarChart(canvas, domainScores); addModalActionButtons(overlay, domainScores, ERQ); return; }
      const k = keys[i];
      const score = domainScores[k];
      const interp = interpretDomain(score);
      const advice = domainAdvice[k] || "";
      const block = document.createElement("div");
      block.style.borderLeft = `4px solid ${interp.color}`;
      block.style.background = "#fbfdfe";
      block.style.padding = ".6rem";
      block.style.borderRadius = "6px";
      block.innerHTML = `<strong>${k}</strong><div style="font-weight:700;color:#0b2545;margin-top:.2rem;">${score}%</div><div style="font-size:.9rem;color:#555;margin-top:.3rem;">${interp.msg}</div><div style="font-size:.9rem;color:#333;margin-top:.45rem;"><em>${advice}</em></div>`;
      grid.appendChild(block);
      i++;
    }, 180);
  }

  // Radar chart draw (Chart.js must be loaded)
  let chartInstance = null;
  function drawRadarChart(canvas, domainScores){
    if(!canvas) return;
    if(typeof Chart === "undefined"){ console.warn("Chart.js not present — skipping radar."); return; }
    const ctx = canvas.getContext("2d");
    if(chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: Object.keys(domainScores),
        datasets: [{
          label: 'Reciprocity Balance',
          data: Object.values(domainScores),
          fill: true,
          backgroundColor: 'rgba(0,77,128,0.15)',
          borderColor: '#004d80',
          pointBackgroundColor: '#c5a46d'
        }]
      },
      options: {
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { stepSize: 20 },
            pointLabels: { color: '#002147', font: { size: 12, weight: '600' } }
          }
        },
        plugins: { legend: { display: false } },
        animation: { duration: 1000 }
      }
    });
  }

  // add Export / Email / Copy / Recalculate buttons into modal area (prevents duplication)
  function addModalActionButtons(overlay, domainScores, ERQ){
    const narrativeText = $("narrativeText");
    if(!narrativeText) return;

    // remove existing actions if any
    const existing = narrativeText.querySelector(".modal-actions");
    if(existing) existing.remove();

    const actions = document.createElement("div");
    actions.className = "modal-actions";
    actions.style.marginTop = "1rem";
    actions.style.display = "flex";
    actions.style.gap = "0.6rem";
    actions.style.flexWrap = "wrap";
    actions.style.justifyContent = "center";

    const pdf = document.createElement("button");
    pdf.className = "btn";
    pdf.textContent = "Export Brief (PDF)";

    const email = document.createElement("button");
    email.className = "btn btn-secondary";
    email.textContent = "Email Results";

    const copy = document.createElement("button");
    copy.className = "btn";
    copy.style.background = "#e6eef7";
    copy.style.color = "#004d80";
    copy.style.border = "1px solid #c5e0ff";
    copy.style.textShadow = "none";
    copy.textContent = "Copy Summary";

    const recalc = document.createElement("button");
    recalc.className = "btn";
    recalc.style.marginLeft = "0.4rem";
    recalc.textContent = "Recalculate / Adjust Sliders";

    actions.append(pdf, email, copy, recalc);
    narrativeText.appendChild(actions);

    pdf.addEventListener("click", ()=> exportPDF(domainScores, ERQ));
    email.addEventListener("click", ()=> emailResults(domainScores, ERQ));
    copy.addEventListener("click", ()=> copySummary(domainScores, ERQ));
    recalc.addEventListener("click", ()=>{
      // close modal and focus the first slider so user can adjust quickly
      closeInterpretiveModal();
      const first = document.querySelector('.survey-panel input[type="range"]');
      if(first){ first.scrollIntoView({behavior:'smooth', block:'center'}); first.focus(); }
    });
  }

  function exportPDF(domainScores, ERQ){
    const jsPDFLib = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF || null);
    if(!jsPDFLib){ alert("PDF export currently unavailable (jsPDF not loaded)."); return; }
    const doc = new jsPDFLib({ unit:'pt', format:'letter' });
    let y = 40;
    doc.setFontSize(18);
    doc.text("MDOA Solutions — ERQ Diagnostic Brief", 40, y); y+=24;
    doc.setFontSize(12);
    doc.text(`Enterprise Reciprocity Quotient (ERQ): ${ERQ}%`, 40, y); y+=18;
    doc.text(`Date: ${new Date().toLocaleDateString()}`,40,y); y+=16;
    doc.text("Domain scores:", 40, y); y+=14;
    for(const [d,s] of Object.entries(domainScores)){
      doc.text(`• ${d}: ${s}%`, 50, y); y+=12;
      if(y>700){ doc.addPage(); y = 40; }
    }
    const filename = `ERQ_Brief_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);
  }

  function emailResults(domainScores, ERQ){
    let body = `Enterprise Reciprocity Quotient (ERQ): ${ERQ}%\n\nDomain Results:\n`;
    for(const [d,s] of Object.entries(domainScores)) body += `• ${d}: ${s}%\n`;
    const link = `mailto:dr.wayneromanishan@mdoasolutions.com?subject=ERQ Diagnostic Results&body=${encodeURIComponent(body)}`;
    window.location.href = link;
  }

  function copySummary(domainScores, ERQ){
    let text = `Enterprise Reciprocity Quotient (ERQ): ${ERQ}%\n\nDomain Results:\n`;
    for(const [d,s] of Object.entries(domainScores)) text += `${d}: ${s}%\n`;
    navigator.clipboard.writeText(text).then(()=> alert("Summary copied to clipboard."));
  }

  // deriveArchetype re-used here
  function deriveArchetype(domainScores){
    const entries = Object.entries(domainScores);
    const sorted = entries.slice().sort((a,b)=>b[1]-a[1]);
    const top = sorted[0][0];
    if (top === "Algorithmic Psychology") return "The Data Steward";
    if (top === "Organizational Development") return "The Architect";
    if (top === "Human Factors Engineering") return "The Empathic System";
    if (top === "Engineering Workflow Management") return "The Flow Keeper";
    if (top === "Talent Management") return "The People Builder";
    if (top === "Document Management") return "The Custodian";
    if (top === "Change Management") return "The Transformer";
    return "The Pragmatist";
  }

  // close modal helper
  function closeInterpretiveModal(){
    const overlay = $("interpretiveModal");
    if(!overlay) return;
    const modalContent = overlay.querySelector(".modal-content");
    if(modalContent) modalContent.classList.remove("reveal");
    overlay.classList.remove("active");
    setTimeout(()=> overlay.style.display = "none", 350);
  }

  // calculation wiring
  function calculateERQ(){
    // compute domain averages and overall
    const domainScores = {};
    let allVals = [];
    Object.entries(domains).forEach(([domain, qIds])=>{
      const vals = qIds.map(q => qVal(`q${q}`,4));
      const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
      const pct = Math.round((avg / 7) * 100);
      domainScores[domain] = pct;
      allVals = allVals.concat(vals);
    });
    const ERQ = Math.round( (allVals.reduce((a,b)=>a+b,0) / (allVals.length * 7)) * 100 );
    openModalWithReveal(domainScores, ERQ);
  }

  // attach listeners once DOM ready
  function init(){
    const calcBtn = $("calcBtn");
    const resetBtn = $("resetBtn");
    const closeModal = $("closeModal");
    if(calcBtn) calcBtn.addEventListener("click", (e)=>{ if(e && e.preventDefault) e.preventDefault(); calculateERQ(); });
    if(resetBtn) resetBtn.addEventListener("click", ()=>{ for(let i=1;i<=28;i++){ const el = $(`q${i}`); if(el) el.value = 4; } });
    if(closeModal) closeModal.addEventListener("click", closeInterpretiveModal);
    // allow clicking overlay background to close
    const overlay = $("interpretiveModal");
    if(overlay) overlay.addEventListener("click", (ev)=> { if(ev.target === overlay) closeInterpretiveModal(); });

    // render slider scales (1..7) for all q-rows
    const rows = document.querySelectorAll(".q-row");
    rows.forEach(row => {
      const range = row.querySelector('input[type="range"]');
      if(!range) return;
      if(row.querySelector(".slider-scale")) return;
      const scale = document.createElement("div");
      scale.className = "slider-scale";
      for(let i=1;i<=7;i++){
        const s = document.createElement("span");
        s.textContent = String(i);
        if(parseInt(range.value,10) === i) s.classList.add("active");
        scale.appendChild(s);
      }
      range.insertAdjacentElement("afterend", scale);
      const update = ()=> {
        const v = Math.round(Number(range.value));
        const spans = scale.querySelectorAll("span");
        spans.forEach((sp,idx)=> sp.classList.toggle("active", (idx+1)===v));
      };
      range.addEventListener("input", update);
      range.addEventListener("change", update);
      update();
    });

    // call it once during init to render scales for existing sliders
    renderSliderScales();
  }

  // boot
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

})();
