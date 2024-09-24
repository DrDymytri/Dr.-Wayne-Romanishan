const target = document.getElementById("shimmerWave");
function splitTextToSpans(targetElement) {
  if (targetElement) {
    const text = targetElement.textContent;
    targetElement.innerHTML = "";
    for (let character of text) {
      const span = document.createElement("span");
      if (character === " ") {
        span.innerHTML = "&nbsp;";
      } else {
        span.textContent = character;
      }
      targetElement.appendChild(span);
    }
  }
}
splitTextToSpans(target);

// Get the dropdown button and the dropdown content
var subnavBtn = document.querySelector('.subnavbtn');
var subnavContent = document.querySelector('.subnav-content');

// Toggle dropdown on button click
subnavBtn.onclick = function() {
  subnavContent.classList.toggle('show'); // Toggle the visibility of the dropdown
};

// Close dropdown if user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.subnavbtn')) {
    if (subnavContent.classList.contains('show')) {
      subnavContent.classList.remove('show'); // Close the dropdown if it's open
    }
  }
};