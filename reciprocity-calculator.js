/* reciprocity-calculator.js
   Handles Reciprocity Quotient (RQ) calculator interactions:
   - Four input sliders (inputSlider, returnSlider, trustSlider, selfRegSlider)
   - Computes RQ via log-normalized ratio and maps to tiers/interpretation
   - Updates gauge needle + text outputs
   - Export PDF summary and quick email (mailto)
   Defensive: safe to include only on pages that have the expected DOM.
*/

(function () {
  'use strict';

  // Utility
  const $ = id => document.getElementById(id);
  const safeAdd = (el, ev, fn) => { if (el) el.addEventListener(ev, fn); };

  function init() {
    const inputSlider = $('inputSlider');
    const returnSlider = $('returnSlider');
    const trustSlider = $('trustSlider');
    const selfRegSlider = $('selfRegSlider');

    // UI targets
    const inputVal = $('inputVal');
    const returnVal = $('returnVal');
    const trustVal = $('trustVal');
    const selfRegVal = $('selfRegVal');

    const gaugeNeedle = $('gaugeNeedle') || document.querySelector('.needle') || $('rq-needle');
    const rqNumber = $('rqNumber') || $('rqValue') || document.querySelector('.rq-bubble');
    const rqTier = $('rqTier') || document.querySelector('.rq-tier');
    const rqDesc = $('rqDesc') || document.querySelector('.rq-desc');

    // Early exit if required sliders missing (page doesn't need the script)
    if (!inputSlider || !returnSlider || !trustSlider || !selfRegSlider) return;

    // Constants for normalization (derived from 1..5 scales)
    const minRaw = (1 * 1) / (5 * 5); // 0.04
    const maxRaw = (5 * 5) / (1 * 1); // 25

    function refreshRangeDisplays() {
      if (inputVal) inputVal.textContent = inputSlider.value;
      if (returnVal) returnVal.textContent = returnSlider.value;
      if (trustVal) trustVal.textContent = trustSlider.value;
      if (selfRegVal) selfRegVal.textContent = selfRegSlider.value;
    }

    function computeRQ() {
      const inp = parseInt(inputSlider.value, 10) || 3;
      const ret = parseInt(returnSlider.value, 10) || 3;
      const tr = parseInt(trustSlider.value, 10) || 3;
      const sr = parseInt(selfRegSlider.value, 10) || 3;

      // raw ratio (higher ret/trust relative to input/self-reg => higher RQ)
      const raw = (ret * tr) / (inp * sr);
      const safeRaw = Math.max(raw, 0.000001);

      // log-normalize to 0..1 scale
      const norm = (Math.log(safeRaw) - Math.log(minRaw)) / (Math.log(maxRaw) - Math.log(minRaw));
      let percent = Math.round(Math.max(0, Math.min(1, norm)) * 100);
      percent = Math.max(0, Math.min(100, percent));
      return { percent, raw, inp, ret, tr, sr };
    }

    function tierAndInterpretation(percent) {
      if (percent < 40) return { tier: '🔴 Under-Reciprocity', desc: 'Energy deficit detected — giving more than you receive.', color: '#c0392b' };
      if (percent < 55) return { tier: '🟠 Reactive Reciprocity', desc: 'Awareness of imbalance; strategies inconsistent.', color: '#f39c12' };
      if (percent < 70) return { tier: '🟡 Developing Equilibrium', desc: 'Emerging balance but fragile in places.', color: '#f1c40f' };
      if (percent < 85) return { tier: '🟢 Reciprocal Synergy', desc: 'Healthy reciprocity — maintenance recommended.', color: '#27ae60' };
      return { tier: '🔵 Regenerative Collaboration', desc: 'High reciprocity — consider scaling and sustaining.', color: '#1abc9c' };
    }

    function updateUI() {
      refreshRangeDisplays();
      const { percent } = computeRQ();
      const interp = tierAndInterpretation(percent);

      if (rqNumber) rqNumber.textContent = `${percent}%`;
      if (rqTier) rqTier.textContent = interp.tier;
      if (rqDesc) rqDesc.textContent = interp.desc;

      // rotate needle: percent 0..100 -> angle -90..+90
      if (gaugeNeedle && gaugeNeedle.style) {
        const angle = (percent / 100) * 180 - 90;
        gaugeNeedle.style.transform = `rotate(${angle}deg)`;
      }
    }

    // initial update
    updateUI();

    // add listeners
    [inputSlider, returnSlider, trustSlider, selfRegSlider].forEach(s => safeAdd(s, 'input', updateUI));

    // Export & Email
    const exportPdfBtn = $('exportPdfBtn') || $('exportPdf') || $('exportPdfButton');
    const emailBtn = $('emailBtn') || $('emailRQBtn') || $('emailRQ');

    function doExportPdf() {
      // Clean weird unicode / RTF characters that break jsPDF
      function cleanText(str) {
        return String(str)
          .replace(/[\u2018\u2019\u201C\u201D]/g, "'")           // smart quotes → '
          .replace(/[\u2013\u2014]/g, "-")                     // long dashes → -
          .replace(/[\u2026]/g, "...")                         // ellipsis → ...
          .replace(/[^\x00-\x7F]/g, "")                        // strip non-ASCII safely
          .replace(/&/g, "and")                                // & safe replace
          .trim();
      }

      const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || (window.jspdf && window.jspdf.default) || null;
      if (!jsPDFCtor) { alert('PDF export is unavailable (jsPDF not loaded).'); return; }

      const { percent, raw, inp, ret, tr, sr } = computeRQ();
      const interp = tierAndInterpretation(percent);

      const doc = new jsPDFCtor({ unit: 'pt', format: 'letter' });
      let y = 40;
      doc.setFontSize(18);
      doc.text("MDOA Solutions — Reciprocity Quotient Summary", 40, y);
      y += 28;
      doc.setFontSize(12);
      doc.text(cleanText(`RQ: ${percent}% — ${interp.tier}`), 40, y);
      y += 18;
      const lines = doc.splitTextToSize(interp.desc, 480);
      doc.text(lines, 40, y);
      y += lines.length * 14 + 8;

      doc.text("Profile Inputs:", 40, y); y += 16;
      doc.text(`• Perceived Input: ${inp} (1-5 scale)`, 50, y); y += 14;
      doc.text(`• Perceived Return: ${ret} (1-5 scale)`, 50, y); y += 14;
      doc.text(`• Systemic Trust: ${tr} (1-5 scale)`, 50, y); y += 14;
      doc.text(`• Self-Regulation: ${sr} (1-5 scale)`, 50, y); y += 18;

      doc.text("Interpretive Note:", 40, y); y += 16;
      const note = "This RQ is a reflective measure. For a full diagnostic and roadmap, contact MDOA Solutions.";
      doc.text(doc.splitTextToSize(note, 500), 40, y);

      const filename = `RQ_Summary_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(filename);
    }

    function doEmail() {
      const { percent, raw, inp, ret, tr, sr } = computeRQ();
      const interp = tierAndInterpretation(percent);
      const subject = `RQ Diagnostic Request — ${percent}%`;
      const bodyLines = [
        `Reciprocity Quotient: ${percent}% — ${interp.tier}`,
        '',
        'Interpretation:',
        interp.desc,
        '',
        'Profile:',
        `- Perceived Input: ${inp}`,
        `- Perceived Return: ${ret}`,
        `- Systemic Trust: ${tr}`,
        `- Self-Regulation: ${sr}`,
        '',
        'Please contact me to schedule a professional diagnostic and roadmap from MDOA Solutions.'
      ];
      window.location.href = `mailto:dr.wayneromanishan@mdoasolutions.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    }

    if (exportPdfBtn) safeAdd(exportPdfBtn, 'click', doExportPdf);
    if (emailBtn) safeAdd(emailBtn, 'click', doEmail);

    // keyboard accessibility: space/arrow keys already work for range; no extra wiring required
  }

  // init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
