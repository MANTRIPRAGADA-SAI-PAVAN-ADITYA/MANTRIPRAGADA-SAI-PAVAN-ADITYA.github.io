# Sai Pavan Aditya Mantripragada — Portfolio

Personal portfolio website for **Sai Pavan Aditya Mantripragada**, AI/ML Engineer.

## 🚀 Hosted on GitHub Pages

Live at: `https://MANTRIPRAGADA-SAI-PAVAN-ADITYA.github.io/<repo-name>/`

## 📁 Structure

```
portfolio/
├── index.html          # Home / Hero
├── about.html          # About + Aspirations
├── skills.html         # Technical skills + proficiency bars
├── journey.html        # Career timeline (BEng → present)
├── projects.html       # All 8 projects with metrics
├── research.html       # Publications + Certifications + Recognition
├── social.html         # Live GitHub API + LinkedIn profile card
├── contact.html        # Contact form + links
├── 404.html            # Custom 404 page
├── assets/
│   ├── css/
│   │   └── main.css    # All styles (dark + light themes)
│   └── js/
│       ├── theme.js    # Dark/light toggle with localStorage
│       ├── nav.js      # Navigation + hamburger + scroll effects
│       └── main.js     # Particles, animations, typed text, skill bars
├── _config.yml         # GitHub Pages config
└── .nojekyll           # Bypasses Jekyll processing
```

## 🌓 Features

- **Dark / Light mode** — persisted to `localStorage`, no flash on load
- **Live GitHub integration** — profile card, repos, and stats via GitHub API
- **LinkedIn profile card** — rich embedded card (LinkedIn blocks iframes natively)
- **Animated particles** — canvas-based background
- **Scroll animations** — IntersectionObserver fade-ups
- **Typed text effect** — cycling role titles on hero
- **Animated skill bars** — triggered on scroll
- **Fully responsive** — mobile-first hamburger nav
- **Zero dependencies** — pure HTML/CSS/JS, no build step required

## 🌐 Deploy to GitHub Pages

1. Create a new GitHub repo (e.g. `portfolio`)
2. Push this folder contents to the repo root
3. Go to **Settings → Pages → Source → Deploy from branch → main / root**
4. Site will be live at `https://<username>.github.io/portfolio/`

> Tip: For a root domain (`username.github.io`), name the repo `<username>.github.io` and push to main.
