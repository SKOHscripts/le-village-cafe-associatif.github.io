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

  // Libellés dans la langue affichée (village-i18n.js).
  function isEn() { return !!(window.i18n && window.i18n.locale === 'en'); }
  function txt(fr, en) { return isEn() ? en : fr; }
  function zoomLabel(alt) {
    return alt ? txt('Agrandir : ', 'Enlarge: ') + alt : txt('Agrandir l’image', 'Enlarge image');
  }

  function ensureOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', txt('Vue agrandie', 'Enlarged view'));

    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'lb-close';
    closeBtn.setAttribute('aria-label', txt('Fermer la vue agrandie', 'Close enlarged view'));
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
    closeBtn.setAttribute('aria-label', txt('Fermer la vue agrandie', 'Close enlarged view'));
    overlayImg.alt = alt ? txt('Vue agrandie : ', 'Enlarged view: ') + alt : txt('Vue agrandie', 'Enlarged view');
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
      // Libellé calculé ici : on le recalcule au changement de langue.
      img.dataset.zoomAutoLabel = '1';
      img.setAttribute('aria-label', zoomLabel(img.getAttribute('alt') || ''));
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

    document.addEventListener('i18n:changed', function () {
      document.querySelectorAll('img[data-zoom-auto-label="1"]').forEach(function (img) {
        img.setAttribute('aria-label', zoomLabel(img.getAttribute('alt') || ''));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
