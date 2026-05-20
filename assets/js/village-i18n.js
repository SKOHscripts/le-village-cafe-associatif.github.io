(function () {
  'use strict';

  const SUPPORTED = ['fr', 'en'];
  const DEFAULT   = 'fr';
  const STORAGE_KEY = 'village-lang';

  function detectLocale() {
    try {
      const params   = new URLSearchParams(window.location.search);
      const fromUrl  = params.get('lang');
      if (fromUrl === 'auto') {
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      } else if (fromUrl && SUPPORTED.includes(fromUrl)) {
        return fromUrl;
      }
    } catch (_) {}

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.includes(stored)) return stored;
    } catch (_) {}

    const candidates = (navigator.languages && navigator.languages.length)
      ? navigator.languages : [navigator.language || ''];
    for (const cand of candidates) {
      const tag = String(cand).toLowerCase().split('-')[0];
      if (SUPPORTED.includes(tag)) return tag;
    }
    return DEFAULT;
  }

  let currentLang = detectLocale();

  function applyLang(lang, persist) {
    currentLang = lang;
    if (persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    }

    document.documentElement.lang = lang;

    document.querySelectorAll('[data-fr]').forEach(el => {
      const val = lang === 'en' ? el.dataset.en : el.dataset.fr;
      if (val !== undefined) el.textContent = val;
    });

    document.querySelectorAll('[data-fr-html]').forEach(el => {
      const val = lang === 'en' ? el.dataset.enHtml : el.dataset.frHtml;
      if (val !== undefined) {
        const doc = new DOMParser().parseFromString(val, 'text/html');
        el.replaceChildren.apply(el, doc.body.childNodes);
      }
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { locale: lang } }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyLang(currentLang, false));
  } else {
    applyLang(currentLang, false);
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.lang-btn');
    if (!btn || !btn.dataset.lang) return;
    const lang = btn.dataset.lang;
    if (SUPPORTED.includes(lang)) applyLang(lang);
  });

  window.i18n = {
    get locale() { return currentLang; },
    setLocale: applyLang,
    SUPPORTED,
  };
})();
