/* =============================================
   LE VILLAGE — i18n.js
   Internationalisation client-side (FR / EN)
   - Détection automatique de la langue du navigateur
   - Sélecteur manuel mémorisé via localStorage
   - Application des traductions par attributs data-i18n
   ============================================= */

(function () {
  'use strict';

  const SUPPORTED = ['fr', 'en'];
  const DEFAULT_LOCALE = 'en';
  const STORAGE_KEY = 'village.lang';
  const DICT_URL = 'data/i18n.json';
  const KEY_RE = /^[A-Za-z][A-Za-z0-9._-]*$/;

  function resolveLocale() {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('lang');
      if (fromUrl && SUPPORTED.includes(fromUrl)) return fromUrl;
    } catch (_) { /* ignore */ }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.includes(stored)) return stored;
    } catch (_) { /* ignore */ }

    const candidates = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || ''];
    for (const cand of candidates) {
      const tag = String(cand).toLowerCase().split('-')[0];
      if (SUPPORTED.includes(tag)) return tag;
    }
    return DEFAULT_LOCALE;
  }

  const state = {
    locale: resolveLocale(),
    dict: null,
  };

  function t(key, vars) {
    if (!state.dict) return '';
    if (typeof key !== 'string' || !KEY_RE.test(key)) return '';
    if (!Object.prototype.hasOwnProperty.call(state.dict, key)) return key;
    const entry = state.dict[key];
    if (!entry) return key;
    let value = entry[state.locale];
    if (value == null) value = entry.fr != null ? entry.fr : '';
    if (vars) {
      value = value.replace(/\{(\w+)\}/g, function (_, name) {
        return vars[name] != null ? vars[name] : '';
      });
    }
    return value;
  }

  function parseAttrSpec(spec) {
    const out = [];
    String(spec).split(';').forEach(pair => {
      const idx = pair.indexOf(':');
      if (idx < 0) return;
      const attr = pair.slice(0, idx).trim();
      const key = pair.slice(idx + 1).trim();
      if (attr && key) out.push([attr, key]);
    });
    return out;
  }

  function applyTo(root) {
    if (!state.dict) return;
    const scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key || !KEY_RE.test(key)) return;
      el.textContent = t(key);
    });

    scope.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (!key || !KEY_RE.test(key)) return;
      el.innerHTML = t(key);
    });

    scope.querySelectorAll('[data-i18n-attr]').forEach(el => {
      parseAttrSpec(el.getAttribute('data-i18n-attr')).forEach(([attr, key]) => {
        if (!KEY_RE.test(attr) || !KEY_RE.test(key)) return;
        el.setAttribute(attr, t(key));
      });
    });

    document.documentElement.lang = state.locale;

    const titleKey = document.documentElement.getAttribute('data-i18n-title');
    if (titleKey && KEY_RE.test(titleKey)) document.title = t(titleKey);
  }

  function setLocale(loc) {
    if (!SUPPORTED.includes(loc) || loc === state.locale) return;
    state.locale = loc;
    try { localStorage.setItem(STORAGE_KEY, loc); } catch (_) { /* ignore */ }
    applyTo(document);
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { locale: loc } }));
  }

  const ready = fetch(DICT_URL)
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(dict => {
      state.dict = dict;
      const apply = () => {
        applyTo(document);
        document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { locale: state.locale } }));
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply, { once: true });
      } else {
        apply();
      }
    })
    .catch(err => {
      console.warn('[i18n] dictionnaire indisponible :', err);
      document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { locale: state.locale, failed: true } }));
    });

  window.i18n = {
    get locale() { return state.locale; },
    get dict() { return state.dict; },
    t,
    apply: applyTo,
    setLocale,
    ready,
    SUPPORTED,
  };
})();
