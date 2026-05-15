/* =============================================
   LE VILLAGE — components.js
   Header et footer mutualisés
   Injecte automatiquement le header et le footer
   sur toutes les pages qui chargent ce fichier.
   ============================================= */

// ── Déterminer la page active ──────────────────
const CURRENT_PAGE = window.location.pathname.split('/').pop() || 'index.html';

// ── SVG icons (Heroicons — MIT) ────────────────
const ICONS = {
  home:     `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 2.5L2 9.5V18h5.5v-5h5v5H18V9.5L10 2.5z"/></svg>`,
  people:   `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>`,
  calendar: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M6 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1a2 2 0 012 2v11a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm-1 6a1 1 0 000 2h8a1 1 0 100-2H5z" clip-rule="evenodd"/></svg>`,
  menu:     `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1h8V3a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>`,
  lightbulb:`<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.298.025-.597.025-.9C12.025 11.4 11.1 10 10 10S7.975 11.4 7.975 13.1c0 .303.01.602.025.9H12z"/></svg>`,
  mail:     `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>`,
  card:     `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/></svg>`,
  heart:    `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/></svg>`,
};

// ── HTML du header ─────────────────────────────
const HEADER_HTML = `
<header class="site-header" role="banner">
  <div class="header-inner">
    <a href="index.html" class="header-logo" data-i18n-attr="aria-label:nav.aria.logo">
      <img src="assets/images/logo-header.png" alt="" class="header-logo-img">
    </a>

    <nav class="nav-desktop" data-i18n-attr="aria-label:nav.aria.main">
      <ul>
        <li><a href="index.html" data-i18n="nav.home">Accueil</a></li>
        <li><a href="qui-sommes-nous.html" data-i18n="nav.about">Qui sommes-nous</a></li>
        <li><a href="agenda.html" data-i18n="nav.agenda">Agenda</a></li>
        <li><a href="carte.html" data-i18n="nav.menu">La Carte</a></li>
        <li><a href="adhesion.html" data-i18n="nav.membership">Adhésion</a></li>
        <li><a href="don.html" data-i18n="nav.donate">Faire un don</a></li>
        <li><a href="boite-a-idees.html" data-i18n="nav.ideas">Boîte à idées</a></li>
        <li><a href="contact.html" data-i18n="nav.contact">Contact</a></li>
      </ul>
    </nav>

    <div class="lang-switch" role="group" data-i18n-attr="aria-label:lang.switch.aria">
      <button type="button" class="lang-switch-btn" data-lang="fr" data-i18n-attr="aria-label:lang.fr.aria">FR</button>
      <button type="button" class="lang-switch-btn" data-lang="en" data-i18n-attr="aria-label:lang.en.aria">EN</button>
    </div>

    <button class="nav-burger" id="nav-burger" data-i18n-attr="aria-label:nav.aria.burger" aria-expanded="false" aria-controls="nav-mobile">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<nav class="nav-mobile" id="nav-mobile" data-i18n-attr="aria-label:nav.aria.mobile">
  <a href="index.html"><span class="nav-icon">${ICONS.home}</span> <span data-i18n="nav.home">Accueil</span></a>
  <a href="qui-sommes-nous.html"><span class="nav-icon">${ICONS.people}</span> <span data-i18n="nav.about">Qui sommes-nous</span></a>
  <a href="agenda.html"><span class="nav-icon">${ICONS.calendar}</span> <span data-i18n="nav.agenda">Agenda</span></a>
  <a href="carte.html"><span class="nav-icon">${ICONS.menu}</span> <span data-i18n="nav.menu">La Carte</span></a>
  <a href="adhesion.html"><span class="nav-icon">${ICONS.card}</span> <span data-i18n="nav.membership">Adhésion</span></a>
  <a href="don.html"><span class="nav-icon">${ICONS.heart}</span> <span data-i18n="nav.donate">Faire un don</span></a>
  <a href="boite-a-idees.html"><span class="nav-icon">${ICONS.lightbulb}</span> <span data-i18n="nav.ideas">Boîte à idées</span></a>
  <a href="contact.html"><span class="nav-icon">${ICONS.mail}</span> <span data-i18n="nav.contact">Contact</span></a>
  <div class="lang-switch lang-switch--mobile" role="group" data-i18n-attr="aria-label:lang.switch.aria">
    <button type="button" class="lang-switch-btn" data-lang="fr" data-i18n-attr="aria-label:lang.fr.aria">FR</button>
    <button type="button" class="lang-switch-btn" data-lang="en" data-i18n-attr="aria-label:lang.en.aria">EN</button>
  </div>
</nav>
<div class="nav-overlay" id="nav-overlay" aria-hidden="true"></div>
<div class="header-spacer"></div>
`;

// ── HTML du footer ─────────────────────────────
const FOOTER_HTML = `
<footer class="site-footer" role="contentinfo">
  <div class="container">
    <div class="site-footer-inner">

      <div class="sf-brand">
        <img src="assets/images/logo-detoure-orange.png" data-i18n-attr="alt:footer.brand.alt" class="sf-brand-logo">
      </div>

      <div class="sf-divider"></div>

      <div class="sf-info">
        <div class="sf-label" data-i18n="footer.hours">Horaires</div>
        <div class="sf-line"><span class="sf-dot"></span> <span data-i18n="footer.hours.tue">Mar</span> <span data-i18n="hours.tue.value">14h30 – 19h00</span></div>
        <div class="sf-line"><span class="sf-dot"></span> <span data-i18n="footer.hours.fri">Ven</span> <span>16h00 – <s>21h00</s> <span class="sf-ete" data-i18n="footer.hours.summer">22h00 en été</span></span></div>
        <div class="sf-line"><span class="sf-dot"></span> <span data-i18n="footer.hours.sun">Dim</span> <span data-i18n="hours.sun.value">10h00 – 13h00</span></div>
      </div>

      <div class="sf-divider"></div>

      <div class="sf-info">
        <div class="sf-label" data-i18n="footer.find">Nous trouver</div>
        <div class="sf-line">8 rue Chalumeaux</div>
        <div class="sf-line">Lyon 8e</div>
        <div class="sf-line" style="margin-top:4px">
          <a href="mailto:contact@cafe-levillage.org">contact@cafe-levillage.org</a>
        </div>
      </div>

    </div>

    <div class="sf-bottom">
      <p data-i18n="footer.legal">© 2026 Café Associatif Le Village · Association loi 1901</p>
      <div class="sf-secret-links">
        <a href="benevoles.html" data-i18n="footer.volunteers">Espace bénévoles</a>
        <a href="ca.html" data-i18n="footer.board">Espace CA</a>
      </div>
    </div>
  </div>
</footer>
`;

// ── Injection au chargement du DOM ─────────────
document.addEventListener('DOMContentLoaded', () => {

  if (!document.body.dataset.noComponents) {

    const headerEl = document.createElement('div');
    headerEl.innerHTML = HEADER_HTML;
    document.body.insertBefore(headerEl, document.body.firstChild);

    const existingFooter = document.querySelector('footer.site-footer');
    const footerEl = document.createElement('div');
    footerEl.innerHTML = FOOTER_HTML;

    if (existingFooter) {
      existingFooter.replaceWith(footerEl.firstElementChild);
    } else {
      document.body.appendChild(footerEl.firstElementChild);
    }

    document.querySelectorAll('.nav-desktop a, .nav-mobile a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === CURRENT_PAGE || (CURRENT_PAGE === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });

    initBurger();
    initLangSwitch();

    if (window.i18n && window.i18n.dict) {
      window.i18n.apply(document);
    }
  }
});

// ── Logique burger ─────────────────────────────
function initBurger() {
  const burger  = document.getElementById('nav-burger');
  const menu    = document.getElementById('nav-mobile');
  const overlay = document.getElementById('nav-overlay');

  if (!burger || !menu) return;

  function openMenu() {
    burger.classList.add('open');
    menu.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    burger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    burger.classList.remove('open');
    menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
    burger.setAttribute('aria-expanded', 'false');
  }

  burger.addEventListener('click', () => {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });

  if (overlay) overlay.addEventListener('click', closeMenu);
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
}

// ── Logique sélecteur de langue ────────────────
function initLangSwitch() {
  if (!window.i18n) return;

  function refreshPressed() {
    document.querySelectorAll('.lang-switch-btn').forEach(btn => {
      const active = btn.dataset.lang === window.i18n.locale;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.lang-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.i18n.setLocale(btn.dataset.lang);
    });
  });

  refreshPressed();
  document.addEventListener('i18n:changed', refreshPressed);
}
