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
