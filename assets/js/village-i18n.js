(function () {
  'use strict';

  const SUPPORTED = ['fr', 'en'];
  const DEFAULT   = 'fr';
  const LOCALE_PREF = 'village-lang';

  function detectLocale() {
    try {
      const params   = new URLSearchParams(window.location.search);
      const fromUrl  = params.get('lang');
      if (fromUrl === 'auto') {
        try { localStorage.removeItem(LOCALE_PREF); } catch (_) {}
      } else if (fromUrl && SUPPORTED.includes(fromUrl)) {
        return fromUrl;
      }
    } catch (_) {}

    try {
      const stored = localStorage.getItem(LOCALE_PREF);
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
      try { localStorage.setItem(LOCALE_PREF, lang); } catch (_) {}
    }

    document.documentElement.lang = lang;

    document.querySelectorAll('[data-fr]').forEach(el => {
      const text = lang === 'en' ? el.dataset.en : el.dataset.fr;
      if (text !== undefined) el.textContent = text;
    });

    document.querySelectorAll('[data-fr-html]').forEach(el => {
      const markup = lang === 'en' ? el.dataset.enHtml : el.dataset.frHtml;
      if (markup !== undefined) {
        const parsed = new DOMParser().parseFromString(markup, 'text/html');
        el.replaceChildren.apply(el, parsed.body.childNodes);
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
