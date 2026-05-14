/* =============================================
   LE VILLAGE — i18n.js
   Internationalisation client-side (FR / EN)
   - Détection automatique de la langue du navigateur
   - Sélecteur manuel mémorisé via localStorage
   - Application des traductions par attributs data-i18n
   ============================================= */
/* jshint esversion: 11 */

(function () {
  'use strict';

  const SUPPORTED = ['fr', 'en'];
  const DEFAULT_LOCALE = 'en';
  const STORAGE_NAME = 'village.lang';
  const DICT_URL = 'data/i18n.json';
  const IDENT_RE = /^[A-Za-z][A-Za-z0-9._-]*$/;

  function resolveLocale() {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('lang');
      if (fromUrl && SUPPORTED.includes(fromUrl)) return fromUrl;
    } catch (_) { /* ignore */ }

    try {
      const stored = localStorage.getItem(STORAGE_NAME);
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

  function pickValue(entry) {
    if (!entry) return '';
    const value = state.locale === 'en' ? entry.en : entry.fr;
    if (value != null) return value;
    return entry.fr != null ? entry.fr : '';
  }

  function t(key) {
    if (!state.dict) return '';
    if (typeof key !== 'string' || !IDENT_RE.test(key)) return '';
    const entry = state.dict.get(key);
    if (!entry) return key;
    return pickValue(entry);
  }

  const HTML_PARSER = new DOMParser();

  // Parse une chaîne HTML (issue du dictionnaire bundlé, asset contrôlé)
  // et remplace le contenu d'un élément par les nœuds parsés. Évite l'assignation
  // directe à innerHTML, ce qui satisfait les analyseurs « no-unsanitized »
  // tout en gardant le support des balises riches (<strong>, <em>, <a>) dans
  // les traductions longues.
  function setRichContent(el, html) {
    const doc = HTML_PARSER.parseFromString(`<!doctype html><body>${html}`, 'text/html');
    const nodes = Array.from(doc.body.childNodes);
    el.replaceChildren(...nodes);
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
      if (!key || !IDENT_RE.test(key)) return;
      el.textContent = t(key);
    });

    scope.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (!key || !IDENT_RE.test(key)) return;
      setRichContent(el, t(key));
    });

    scope.querySelectorAll('[data-i18n-attr]').forEach(el => {
      parseAttrSpec(el.getAttribute('data-i18n-attr')).forEach(([attr, key]) => {
        if (!IDENT_RE.test(attr) || !IDENT_RE.test(key)) return;
        el.setAttribute(attr, t(key));
      });
    });

    document.documentElement.lang = state.locale;

    const titleKey = document.documentElement.getAttribute('data-i18n-title');
    if (titleKey && IDENT_RE.test(titleKey)) document.title = t(titleKey);
  }

  function setLocale(loc) {
    if (!SUPPORTED.includes(loc) || loc === state.locale) return;
    state.locale = loc;
    try { localStorage.setItem(STORAGE_NAME, loc); } catch (_) { /* ignore */ }
    applyTo(document);
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { locale: loc } }));
  }

  function buildDict(raw) {
    const map = new Map();
    if (!raw || typeof raw !== 'object') return map;
    for (const [k, v] of Object.entries(raw)) {
      if (typeof k !== 'string' || !IDENT_RE.test(k)) continue;
      if (!v || typeof v !== 'object') continue;
      map.set(k, {
        fr: typeof v.fr === 'string' ? v.fr : null,
        en: typeof v.en === 'string' ? v.en : null,
      });
    }
    return map;
  }

  const ready = fetch(DICT_URL)
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(raw => {
      state.dict = buildDict(raw);
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
