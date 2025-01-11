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
