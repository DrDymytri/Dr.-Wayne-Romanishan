// Get the modal
var modal = document.getElementById("myModal");
// Get the button that opens the modal
var btn = document.getElementById("openModalBtn");
// Get the <span> element that closes the modal
var closeBtn = document.querySelector(".modal-close");

// When the user clicks the button, open the modal and disable body scroll
btn.onclick = function() {
  modal.style.display = "flex";  // Display modal
  document.body.classList.add("no-scroll");  // Disable body scroll
}

// When the user clicks on <span> (x), close the modal and re-enable body scroll
closeBtn.onclick = function() {
  modal.style.display = "none";  // Hide modal
  document.body.classList.remove("no-scroll");  // Re-enable body scroll
}

// Optionally: When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    document.body.classList.remove("no-scroll");  // Re-enable body scroll
  }
}
