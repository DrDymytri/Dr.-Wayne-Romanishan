/* consultation-form.js
   Handles the Consultation Request form interactions:
   - Reciprocity slider (percent + interpretation)
   - Export one-page brief (jsPDF)
   - Email via mailto (populates body)
   - Lightweight required-field validation
   Defensive & idempotent: safe to include only on consultation page.
*/

(function () {
  'use strict';

  // Helpers
  const $ = id => document.getElementById(id);
  const safeAdd = (el, ev, fn) => { if (el) el.addEventListener(ev, fn); };
  const safeElText = (el, txt) => { if (el) el.textContent = txt; };

  function init() {
    const reciprocity = $('reciprocity');
    const recInterp = $('reciprocityInterpretation');
    const recPercentEl = document.querySelector('.reciprocity-indicator') || $('reciprocityPercent');

    // Provide fallback if indicator element missing — create one inside .reciprocity-row if possible
    if (!recPercentEl && reciprocity) {
      const row = document.querySelector('.reciprocity-row');
      if (row) {
        const span = document.createElement('div');
        span.className = 'reciprocity-indicator';
        span.id = 'reciprocityPercent';
        span.style.minWidth = '88px';
        span.style.fontWeight = '700';
        row.appendChild(span);
      }
    }

    // Reciprocity UI update
    function updateReciprocityUI() {
      if (!reciprocity) return;
      const v = parseInt(reciprocity.value, 10) || 3;
      const pct = Math.round(((v - 1) / 4) * 100); // 1->0, 5->100

      const pctText = `${pct}%`;
      const indicator = document.getElementById('reciprocityPercent') || document.querySelector('.reciprocity-indicator');
      if (indicator) indicator.textContent = pctText;

      let text = '';
      if (v <= 2) text = 'Energy deficit detected — organizational reciprocity is poor.';
      else if (v === 3) text = 'Developing balance — some areas are fair, others need work.';
      else if (v === 4) text = 'Balance largely intact — targeted improvements will optimize sustainability.';
      else text = 'Strong reciprocity — a regenerative environment is present.';

      if (recInterp) recInterp.textContent = `${pctText} — ${text}`;
      else {
        // If there is no recInterp element, try the provided id
        const r = $('reciprocityInterpretation');
        if (r) r.textContent = `${pctText} — ${text}`;
      }
    }

    safeAdd(reciprocity, 'input', updateReciprocityUI);
    updateReciprocityUI();

    // Form actions: export PDF and email
    const exportBtn = $('exportBtn');
    const emailBtn = $('emailBtn');

    function requireContact() {
      const email = ($('contactEmail') && $('contactEmail').value || '').trim();
      const name = ($('contactName') && $('contactName').value || '').trim();
      const org = ($('orgName') && $('orgName').value || '').trim();
      if (!email || !name || !org) {
        alert('Please provide Organization, Primary Contact, and Email before submitting.');
        return false;
      }
      return true;
    }

    function gatherData() {
      const get = id => (document.getElementById(id) ? document.getElementById(id).value : '');
      const domainsEl = $('domains');
      return {
        orgName: get('orgName'),
        contactName: get('contactName'),
        contactEmail: get('contactEmail'),
        contactPhone: get('contactPhone'),
        domains: domainsEl ? Array.from(domainsEl.selectedOptions).map(o => o.value).join(', ') : '',
        challenge: get('challenge'),
        outcome: get('outcome'),
        readiness: get('readiness') || '',
        alignment: get('alignment') || '',
        startDate: get('startDate') || '',
        reciprocity: $('reciprocity') ? $('reciprocity').value : ''
      };
    }

    async function exportPdf() {
      // use jsPDF from global (UMD wrapper), try multiple access patterns
      const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || (window.jspdf && window.jspdf.default) || null;
      if (!jsPDFCtor) {
        alert('PDF export is unavailable (jsPDF not loaded).');
        return;
      }
      if (!requireContact()) return;

      const data = gatherData();
      const doc = new jsPDFCtor({ unit: 'pt', format: 'letter' });
      let y = 38;
      const left = 48;
      doc.setFontSize(16);
      doc.text('MDOA Solutions — Consultation Request', left, y);
      y += 22;
      doc.setFontSize(11);

      const addLine = (label, value) => {
        const lines = doc.splitTextToSize(`${label}: ${value || '—'}`, 500);
        doc.text(lines, left, y);
        y += lines.length * 14 + 6;
        if (y > doc.internal.pageSize.height - 80) { doc.addPage(); y = 48; }
      };

      addLine('Organization', data.orgName);
      addLine('Primary contact', data.contactName);
      addLine('Contact email', data.contactEmail);
      addLine('Contact phone', data.contactPhone);
      addLine('Domains', data.domains);
      addLine('Preferred start date', data.startDate);
      addLine('Leadership readiness (1-5)', data.readiness);
      addLine('Reciprocity (1-5)', data.reciprocity);
      addLine('Main challenge / objective', data.challenge);
      addLine('Desired outcomes', data.outcome);

      doc.setFontSize(10);
      doc.text('Generated by MDOA Solutions', left, doc.internal.pageSize.height - 40);
      const safeOrg = (data.orgName || 'Client').replace(/[^\w\-]+/g, '_');
      const filename = `${safeOrg}_consultation_request_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(filename);
    }

    function emailResults() {
      if (!requireContact()) return;
      const data = gatherData();
      const subject = `Consultation Request${data.orgName ? ' - ' + data.orgName : ''}`;
      const bodyLines = [
        `Organization: ${data.orgName}`,
        `Primary contact: ${data.contactName}`,
        `Email: ${data.contactEmail}`,
        `Phone: ${data.contactPhone}`,
        `Domains: ${data.domains}`,
        `Preferred start: ${data.startDate}`,
        `Leadership readiness: ${data.readiness}`,
        `Reciprocity (1-5): ${data.reciprocity}`,
        '',
        'Main challenge / objective:',
        data.challenge || '(none provided)',
        '',
        'Desired outcomes:',
        data.outcome || '(none provided)'
      ];
      const mailto = `mailto:dr.wayneromanishan@mdoasolutions.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
      window.location.href = mailto;
    }

    safeAdd(exportBtn, 'click', exportPdf);
    safeAdd(emailBtn, 'click', emailResults);
    // Also attach lightweight validation to protect accidental clicks when missing fields
    if (exportBtn) exportBtn.addEventListener('click', (e) => { if (!requireContact()) e.stopImmediatePropagation(); });
    if (emailBtn) emailBtn.addEventListener('click', (e) => { if (!requireContact()) e.stopImmediatePropagation(); });

    // Small UX: submit form via Enter on inputs triggers no default submit (page has no form submit)
    // Prevent accidental form submit if any <form> present by intercepting the submit event
    const htmlForm = document.querySelector('form');
    if (htmlForm) {
      htmlForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        // default to email action
        emailResults();
      });
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
