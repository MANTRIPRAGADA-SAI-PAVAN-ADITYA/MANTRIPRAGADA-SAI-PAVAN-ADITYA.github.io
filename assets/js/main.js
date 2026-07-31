/**
 * main.js — Particles, scroll animations, skill bars, typed effect
 */
document.addEventListener('DOMContentLoaded', () => {

  // ── Particles canvas ──────────────────────────────────
  const canvas = document.getElementById('particlesCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const count = Math.min(40, Math.floor(window.innerWidth / 40));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.4 + 0.1),
        alpha: Math.random() * 0.5 + 0.1
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(124,106,247,${p.alpha})`
          : `rgba(94,79,219,${p.alpha * 0.6})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── Scroll-triggered fade-up animations ───────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up, .fade-in').forEach(el => observer.observe(el));

  // ── Skill bars ─────────────────────────────────────────
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.skill-bar').forEach(bar => {
          bar.style.width = bar.dataset.width || '80%';
        });
        barObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.skill-card').forEach(c => barObserver.observe(c));

  // ── Typed text effect (hero only) ─────────────────────
  const typedEl  = document.getElementById('typed-text');
  const cursorEl = document.getElementById('typed-cursor');
  if (typedEl) {
    const titles = ['AI/ML Engineer', 'Privacy AI Researcher', 'Data Architect', 'MLOps Specialist', 'LLM Systems Builder'];
    let ti = 0, ci = 0, deleting = false;
    function type() {
      const word = titles[ti];
      if (!deleting) {
        typedEl.textContent = word.slice(0, ++ci);
        if (ci === word.length) { deleting = true; setTimeout(type, 2200); return; }
      } else {
        typedEl.textContent = word.slice(0, --ci);
        if (ci === 0) { deleting = false; ti = (ti + 1) % titles.length; }
      }
      setTimeout(type, deleting ? 55 : 95);
    }
    setTimeout(type, 900);
  }

  // ── Smooth counter animation ───────────────────────────
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count, 10);
        let cur = 0;
        const step = Math.ceil(target / 40);
        const timer = setInterval(() => {
          cur = Math.min(cur + step, target);
          el.textContent = cur;
          if (cur >= target) clearInterval(timer);
        }, 35);
      });
      counterObserver.unobserve(e.target);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.stats-row').forEach(el => counterObserver.observe(el));

  // ── Contact form ───────────────────────────────────────
  // To activate Formspree: sign up at formspree.io, create a form,
  // and paste your endpoint here (e.g. 'https://formspree.io/f/xyzwerty')
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mnjeyvyl';

  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn    = form.querySelector('[type=submit]');
      const status = document.getElementById('formStatus');
      const data   = new FormData(form);

      btn.disabled = true;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Sending…';

      if (FORMSPREE_ENDPOINT && !FORMSPREE_ENDPOINT.includes('REPLACE')) {
        try {
          const resp = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            body: data,
            headers: { 'Accept': 'application/json' }
          });
          if (resp.ok) {
            if (status) { status.textContent = '✓ Message sent! I\'ll get back to you within 24 hours.'; status.className = 'form-status success'; }
            form.reset();
          } else {
            const err = await resp.json();
            throw new Error(err.error || 'Submission failed');
          }
        } catch (err) {
          if (status) { status.textContent = '✗ Could not send — please email saipavanadityam@gmail.com directly.'; status.className = 'form-status error'; }
        }
      } else {
        // mailto fallback
        const mailto = `mailto:saipavanadityam@gmail.com?subject=${encodeURIComponent(data.get('subject') || 'Portfolio Enquiry')}&body=${encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`)}`;
        window.location.href = mailto;
        if (status) { status.textContent = '✓ Opening your email client…'; status.className = 'form-status success'; }
      }

      btn.disabled = false;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Message';
    });
  }
});
