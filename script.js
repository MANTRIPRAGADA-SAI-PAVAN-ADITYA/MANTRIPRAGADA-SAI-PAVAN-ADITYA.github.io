// Scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = 1;
      e.target.style.transform = 'translateY(0)';
    }
  });
},{threshold:0.15});

document.querySelectorAll('.card,.event').forEach(el => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'all .6s ease';
  observer.observe(el);
});

// Project expand
document.querySelectorAll('.toggle').forEach(btn => {
  btn.onclick = () => {
    btn.closest('.card').classList.toggle('open');
  };
});
// Resume modal
function openResume() {
  document.getElementById("resumeModal").style.display = "flex";
}

function closeResume() {
  document.getElementById("resumeModal").style.display = "none";
}
