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

document.querySelector('.subnavbtn').addEventListener('click', function() {
  var subnavContent = document.querySelector('.subnav-content');
  subnavContent.style.display = subnavContent.style.display === 'block' ? 'none' : 'block';
});