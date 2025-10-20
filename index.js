/* index.js
   Home page modal controller
   - Fade + slide-up animation
   - Scroll lock while modal is open
   - Escape to close + clicking overlay closes
   - Basic focus management (return focus + trap TAB)
   - Idempotent wiring for .service cards & inline openModal(...)
*/

(function () {
  'use strict';

  // -------------------------
  // Service content (authoritative)
  // Keep in sync with other copies if needed
  // -------------------------
  const serviceData = {
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

  // -------------------------
  // DOM refs & state
  // -------------------------
  const modal = document.getElementById('serviceModal');
  const modalContent = modal ? modal.querySelector('.modal-content') : null;
  const modalClose = modal ? modal.querySelector('.modal-close') : null;
  const titleEl = modal ? modal.querySelector('#modalTitle') : null;
  const problemEl = modal ? modal.querySelector('#modalProblem') : null;
  const approachEl = modal ? modal.querySelector('#modalApproach') : null;
  const valueEl = modal ? modal.querySelector('#modalValue') : null;
  const proofEl = modal ? modal.querySelector('#modalProof') : null;

  // For focus management
  let lastFocusedElement = null;
  const focusableSelectors = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';

  // Simple guard: if modal not present, expose openModal that warns and return
  if (!modal || !modalContent) {
    window.openModal = function (key) {
      console.warn('Modal element not found for openModal("' + key + '")');
    };
    // still return to avoid further execution
    return;
  }

  // -------------------------
  // Utility helpers
  // -------------------------
  function setBodyScrollLock(lock) {
    if (lock) {
      // preserve existing overflow to restore later
      document.documentElement.dataset._savedOverflow = document.documentElement.style.overflow || '';
      document.body.style.overflow = 'hidden';
    } else {
      const saved = document.documentElement.dataset._savedOverflow || '';
      document.body.style.overflow = saved;
      delete document.documentElement.dataset._savedOverflow;
    }
  }

  function populateModal(data) {
    titleEl.textContent = data.title || '';
    problemEl.textContent = data.problem || '';
    approachEl.textContent = data.approach || '';
    // build value list
    valueEl.innerHTML = '';
    if (Array.isArray(data.value)) {
      data.value.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        valueEl.appendChild(li);
      });
    }
    proofEl.textContent = data.proof || '';
  }

  // Trap focus inside modal (basic)
  function trapFocus(ev) {
    if (ev.key !== 'Tab') return;
    const focusables = Array.from(modal.querySelectorAll(focusableSelectors)).filter(el => el.offsetParent !== null);
    if (focusables.length === 0) {
      ev.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (ev.shiftKey) {
      // shift + tab
      if (active === first || active === modal) {
        ev.preventDefault();
        last.focus();
      }
    } else {
      // tab
      if (active === last) {
        ev.preventDefault();
        first.focus();
      }
    }
  }

  // Close modal
  window.closeServiceModal = function closeServiceModal() {
    // remove classes that animate
    modal.classList.remove('active');
    modalContent.classList.remove('reveal');

    // small delay to allow CSS hide transition if needed
    // remove inline 'display' after transitions (CSS uses display: none when not active)
    setTimeout(() => {
      modal.style.display = 'none';
      setBodyScrollLock(false);
    }, 280); // should match/under CSS transition timing

    // remove listeners
    document.removeEventListener('keydown', keydownHandler);
    modal.removeEventListener('click', overlayClickHandler);

    // restore focus
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
    lastFocusedElement = null;
  };

  // Overlay click
  function overlayClickHandler(ev) {
    // close if click target is the overlay itself (modal), not .modal-content
    if (ev.target === modal) {
      window.closeServiceModal();
    }
  }

  // Keydown handler (Escape + Trap Tab)
  function keydownHandler(ev) {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      window.closeServiceModal();
      return;
    }
    // Trap Tab inside modal
    trapFocus(ev);
  }

  // Open modal (exposed globally and idempotent)
  window.openModal = function openModal(key) {
    const data = serviceData[key];
    // populate, then reveal
    populateModal(data || { title: '', problem: '', approach: '', value: [], proof: '' });

    // show modal (use inline styles + classes to leverage CSS transitions)
    modal.style.display = 'flex';
    // ensure reflow before adding classes to trigger transitions
    // (keeps animations consistent if open/close quickly)
    // eslint-disable-next-line no-unused-expressions
    modal.offsetHeight; // force reflow
    modal.classList.add('active');
    modalContent.classList.add('reveal');

    // scroll lock
    setBodyScrollLock(true);

    // focus management
    lastFocusedElement = document.activeElement;
    // focus close button if present, otherwise the modal content
    (modalClose || modalContent).focus && (modalClose || modalContent).focus();

    // wire events (idempotent)
    // close buttons
    if (modalClose) {
      modalClose.onclick = window.closeServiceModal;
    }

    // overlay click
    modal.addEventListener('click', overlayClickHandler);

    // keyboard (Escape & Tab trap)
    document.addEventListener('keydown', keydownHandler);
  };

  // -------------------------
  // Progressive wiring for service cards (non-inline)
  // -------------------------
  function wireServiceCards() {
    // prefer data-service-key attributes on cards; fallback to inner text mapping
    const cards = Array.from(document.querySelectorAll('.service'));
    cards.forEach(card => {
      // do not attach multiple times
      if (card.dataset._modalWired === '1') return;

      // prefer explicit key attribute
      const keyAttr = card.getAttribute('data-service-key') || null;
      if (keyAttr) {
        card.addEventListener('click', () => openModal(keyAttr));
      } else {
        // try to infer a key by class or heading text mapping (best-effort)
        const heading = card.querySelector('h3');
        if (heading) {
          const normalized = heading.textContent.trim()
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '');
          // Map simple cases
          const map = {
            organizationaldevelopment: 'organizational',
            humanfactorsengineering: 'humanFactors',
            talentmanagement: 'talent',
            engineeringworkflowmanagement: 'workflow',
            documentmanagement: 'documents',
            changemanagement: 'change',
            algorithmicpsychology: 'algorithmic'
          };
          const inferred = map[normalized];
          if (inferred) {
            card.addEventListener('click', () => openModal(inferred));
          }
        }
      }
      card.dataset._modalWired = '1';
    });
  }

  // Attach on DOM ready (if the file is loaded at end of body this still runs quickly)
  document.addEventListener('DOMContentLoaded', () => {
    // wire any cards present
    wireServiceCards();

    // ensure close button accessible via keyboard
    if (modalClose) modalClose.setAttribute('aria-label', 'Close service details');

    // If page used inline onclick="openModal('...')" those will now call our exposed function
  });

  // Safety: expose a quick API to replace the service content at runtime (optional)
  window.__MDOA = window.__MDOA || {};
  window.__MDOA.serviceData = serviceData;
})();
