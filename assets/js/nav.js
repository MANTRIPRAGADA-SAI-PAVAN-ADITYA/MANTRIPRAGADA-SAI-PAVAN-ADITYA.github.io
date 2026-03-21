/**
 * nav.js — Navigation: active link detection, hamburger, scroll effects
 */
document.addEventListener('DOMContentLoaded', () => {
  // ── Active link detection ──────────────────────────────
  const path = window.location.pathname;
  const file = path.split('/').pop() || 'index.html';
  const page = file.replace('.html', '') || 'index';

  document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
    if (link.dataset.page === page) link.classList.add('active');
  });

  // ── Hamburger menu ─────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on link click (mobile)
  navLinks?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger?.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.navbar') && navLinks?.classList.contains('open')) {
      navLinks.classList.remove('open');
      hamburger?.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // ── Scroll: navbar shadow ──────────────────────────────
  const navbar = document.getElementById('navbar');
  const onScroll = () => navbar?.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});
