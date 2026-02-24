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
// Theme toggle
const toggle = document.getElementById("themeToggle");
if (toggle) {
  toggle.onclick = () => {
    document.body.classList.toggle("light");
  };
}
// Animate architecture nodes
document.querySelectorAll('.arch-node').forEach((node, i) => {
  node.style.opacity = 0;
  node.style.transform = 'translateY(20px)';
  node.style.transition = 'all .6s ease';
  setTimeout(() => {
    node.style.opacity = 1;
    node.style.transform = 'translateY(0)';
  }, i * 120);
});
