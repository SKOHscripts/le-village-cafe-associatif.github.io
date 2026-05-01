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
};

// ── HTML du header ─────────────────────────────
const HEADER_HTML = `
<header class="site-header" role="banner">
  <div class="header-inner">
    <a href="index.html" class="header-logo" aria-label="Le Village — retour à l'accueil">
      <img src="assets/images/logo-header.png" alt="" class="header-logo-img">
    </a>

    <nav class="nav-desktop" aria-label="Navigation principale">
      <ul>
        <li><a href="index.html">Accueil</a></li>
        <li><a href="qui-sommes-nous.html">Qui sommes-nous</a></li>
        <li><a href="agenda.html">Agenda</a></li>
        <li><a href="carte.html">La Carte</a></li>
        <li><a href="boite-a-idees.html">Boîte à idées</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </nav>

    <button class="nav-burger" id="nav-burger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav-mobile">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>

<nav class="nav-mobile" id="nav-mobile" aria-label="Menu mobile">
  <a href="index.html"><span class="nav-icon">${ICONS.home}</span> Accueil</a>
  <a href="qui-sommes-nous.html"><span class="nav-icon">${ICONS.people}</span> Qui sommes-nous</a>
  <a href="agenda.html"><span class="nav-icon">${ICONS.calendar}</span> Agenda</a>
  <a href="carte.html"><span class="nav-icon">${ICONS.menu}</span> La Carte</a>
  <a href="boite-a-idees.html"><span class="nav-icon">${ICONS.lightbulb}</span> Boîte à idées</a>
  <a href="contact.html"><span class="nav-icon">${ICONS.mail}</span> Contact</a>
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
        <img src="assets/images/logo-detoure-orange.png" alt="Café Associatif le Village" class="sf-brand-logo">
      </div>

      <div class="sf-divider"></div>

      <div class="sf-info">
        <div class="sf-label">Horaires</div>
        <div class="sf-line"><span class="sf-dot"></span> Mar <span>14h30 – 19h00</span></div>
        <div class="sf-line"><span class="sf-dot"></span> Ven <span>16h00 – <s>21h00</s> <span class="sf-ete">22h00 en été</span></span></div>
        <div class="sf-line"><span class="sf-dot"></span> Dim <span>10h00 – 13h00</span></div>
      </div>

      <div class="sf-divider"></div>

      <div class="sf-info">
        <div class="sf-label">Nous trouver</div>
        <div class="sf-line">8 rue Chalumeaux</div>
        <div class="sf-line">Lyon 8e</div>
        <div class="sf-line" style="margin-top:4px">
          <a href="mailto:contact@cafe-levillage.org">contact@cafe-levillage.org</a>
        </div>
      </div>

    </div>

    <div class="sf-bottom">
      <p>© 2026 Café Associatif Le Village · Association loi 1901</p>
      <div class="sf-secret-links">
        <a href="benevoles.html">Espace bénévoles</a>
        <a href="ca.html">Espace CA</a>
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
