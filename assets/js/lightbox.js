/* =============================================
   LE VILLAGE — lightbox.js
   Composant générique d'agrandissement d'images.
   Toute <img class="js-zoomable"> devient cliquable
   et s'ouvre en plein écran avec gestion clavier
   et lecteurs d'écran.
   ============================================= */

(function () {
  'use strict';

  let overlay = null;
  let overlayImg = null;
  let closeBtn = null;
  let lastTrigger = null;

  function ensureOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Vue agrandie');

    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'lb-close';
    closeBtn.setAttribute('aria-label', 'Fermer la vue agrandie');
    closeBtn.innerHTML = '&times;';

    overlayImg = document.createElement('img');
    overlayImg.alt = '';

    overlay.appendChild(closeBtn);
    overlay.appendChild(overlayImg);
    document.body.appendChild(overlay);

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        close();
      }
    });
  }

  function open(img) {
    ensureOverlay();
    const alt = img.getAttribute('alt') || '';
    overlayImg.src = img.currentSrc || img.src;
    overlayImg.alt = alt ? 'Vue agrandie : ' + alt : 'Vue agrandie';
    overlay.setAttribute('aria-label', overlayImg.alt);
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lastTrigger = img;
    closeBtn.focus();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    overlayImg.removeAttribute('src');
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      // Si la cible n'est pas focusable nativement on s'appuie sur tabindex
      lastTrigger.focus();
    }
    lastTrigger = null;
  }

  function bind(img) {
    if (img.dataset.zoomBound === '1') return;
    img.dataset.zoomBound = '1';
    if (!img.hasAttribute('tabindex')) img.setAttribute('tabindex', '0');
    if (!img.hasAttribute('role')) img.setAttribute('role', 'button');
    if (!img.hasAttribute('aria-label')) {
      const alt = img.getAttribute('alt') || '';
      img.setAttribute('aria-label', alt ? 'Agrandir : ' + alt : 'Agrandir l’image');
    }
    img.addEventListener('click', function () { open(img); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(img);
      }
    });
  }

  function scan(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('img.js-zoomable').forEach(bind);
  }

  function init() {
    scan(document);

    // Observe les images injectées plus tard (événements, équipe…)
    const observer = new MutationObserver(function (mutations) {
      for (const m of mutations) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches('img.js-zoomable')) {
            bind(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('img.js-zoomable').forEach(bind);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
