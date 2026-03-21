/**
 * theme.js — Dark / Light mode manager
 * Reads from localStorage, applies on load, wires toggle button.
 */
(function () {
  const KEY = 'portfolio-theme';
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    // Sync GitHub stats iframe src if present
    document.querySelectorAll('[data-theme-src-dark][data-theme-src-light]').forEach(el => {
      el.src = theme === 'light' ? el.dataset.themeSrcLight : el.dataset.themeSrcDark;
    });
  }

  function toggleTheme() {
    const cur = root.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }

  // Apply saved theme immediately (before paint) — prevents flash
  const saved = localStorage.getItem(KEY) || 'dark';
  applyTheme(saved);

  // Wire button after DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  });

  // Expose globally for other scripts
  window.portfolioTheme = { apply: applyTheme, toggle: toggleTheme, get: () => root.getAttribute('data-theme') };
})();
