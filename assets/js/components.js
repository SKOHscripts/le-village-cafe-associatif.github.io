/* =============================================
   LE VILLAGE — components.js
   Header et footer mutualisés
   Injecte automatiquement le header et le footer
   sur toutes les pages qui chargent ce fichier.
   ============================================= */

// ── Déterminer la page active ──────────────────
const CURRENT_PAGE = window.location.pathname.split('/').pop() || 'index.html';

// ── HTML du header ─────────────────────────────
const HEADER_HTML = `
<header class="site-header" role="banner">
  <div class="header-inner">
    <a href="index.html" class="header-logo" aria-label="Le Village — retour à l'accueil">
      <span class="header-logo-name">le <span>Village</span></span>
      <span class="header-logo-baseline">café associatif · Lyon 8e</span>
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
  <a href="index.html"><span class="nav-icon">🏠</span> Accueil</a>
  <a href="qui-sommes-nous.html"><span class="nav-icon">💛</span> Qui sommes-nous</a>
  <a href="agenda.html"><span class="nav-icon">📅</span> Agenda</a>
  <a href="carte.html"><span class="nav-icon">🍺</span> La Carte</a>
  <a href="boite-a-idees.html"><span class="nav-icon">💡</span> Boîte à idées</a>
  <a href="contact.html"><span class="nav-icon">✉️</span> Contact</a>
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
        <span class="sf-brand-name">le Village ♥</span>
        <span class="sf-brand-sub">grand trou – moulin à vent – petite guille</span>
      </div>

      <div class="sf-divider"></div>

      <div class="sf-info">
        <div class="sf-label">🕐 Horaires</div>
        <div class="sf-line"><span class="sf-dot"></span> Mar <span>14h30 – 19h00</span></div>
        <div class="sf-line"><span class="sf-dot"></span> Ven <span>16h00 – 21h00</span></div>
        <div class="sf-line"><span class="sf-dot"></span> Dim <span>10h00 – 13h00</span></div>
      </div>

      <div class="sf-divider"></div>

      <div class="sf-info">
        <div class="sf-label">📍 Nous trouver</div>
        <div class="sf-line">8 rue Chalumeaux</div>
        <div class="sf-line">Lyon 8e</div>
        <div class="sf-line" style="margin-top:4px">
          <a href="mailto:projetcafeassociatif@gmail.com">✉️ projetcafeassociatif@gmail.com</a>
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

  // Injecter le header au début du body
  // (sauf si la page gère son propre header — détecté par data-no-components)
  if (!document.body.dataset.noComponents) {

    // Header — insérer avant tout le contenu existant
    const headerEl = document.createElement('div');
    headerEl.innerHTML = HEADER_HTML;
    document.body.insertBefore(headerEl, document.body.firstChild);

    // Footer — remplacer le footer existant OU insérer à la fin
    const existingFooter = document.querySelector('footer.site-footer');
    const footerEl = document.createElement('div');
    footerEl.innerHTML = FOOTER_HTML;

    if (existingFooter) {
      existingFooter.replaceWith(footerEl.firstElementChild);
    } else {
      document.body.appendChild(footerEl.firstElementChild);
    }

    // Marquer le lien actif dans la nav
    document.querySelectorAll('.nav-desktop a, .nav-mobile a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === CURRENT_PAGE || (CURRENT_PAGE === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });

    // Initialiser le menu burger (remplace nav.js)
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
