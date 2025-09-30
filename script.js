document.addEventListener("DOMContentLoaded", () => {
  const headers = document.querySelectorAll(".hero--title"); // Get all titles

  headers.forEach((header) => {
    const text = header.textContent.trim(); // Get the text content
    header.innerHTML = ""; // Clear the header text

    // Split by words, not characters
    text.split(" ").forEach((word, wordIndex) => {
      // Wrap each word in a span
      const wordSpan = document.createElement("span");
      wordSpan.style.display = "inline-flex"; // Treat each word as a block
      wordSpan.style.flexWrap = "nowrap"; // Prevent characters in a word from breaking
      wordSpan.style.marginRight = "0.15em"; // Add spacing between words

      word.split("").forEach((char, charIndex) => {
        const charSpan = document.createElement("span");
        charSpan.textContent = char; // Add character
        charSpan.style.animationDelay = `${(wordIndex * 5 + charIndex) * 0.1}s`; // Stagger delay
        charSpan.style.display = "inline-block";
        wordSpan.appendChild(charSpan);
      });

      header.appendChild(wordSpan);
    });
  });
});

function openImagePopup(cardElement) {
  const imageUrl = cardElement.getAttribute("data-image"); // Get the image URL from the card's data attribute
  const popup = window.open(
    "",
    "_blank",
    "width=800,height=600,scrollbars=no,resizable=yes"
  );
  popup.document.write(`
    <html>
      <head>
        <title>Image Preview</title>
        <style>
          body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #000;
          }
          img {
            max-width: 100%;
            max-height: 100%;
          }
        </style>
      </head>
      <body>
        <img src="${imageUrl}" alt="Popup Image">
        <script>
          document.body.addEventListener('click', () => window.close());
        </script>
      </body>
    </html>
  `);
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
