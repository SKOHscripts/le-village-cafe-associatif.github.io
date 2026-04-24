/* =============================================
   LE VILLAGE — nav.js
   Menu burger mobile
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
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
    const isOpen = menu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // Fermer le menu quand on clique sur un lien
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Marquer le lien actif selon la page courante
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-desktop a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});
