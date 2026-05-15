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
    let forceAuto = false;
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('lang');
      if (fromUrl === 'auto') {
        // ?lang=auto : oublie le choix mémorisé et retombe sur la détection navigateur.
        // Utile pour re-tester l'auto-détection (notamment sur mobile, sans DevTools).
        forceAuto = true;
        try { localStorage.removeItem(STORAGE_NAME); } catch (_) { /* ignore */ }
      } else if (fromUrl && SUPPORTED.includes(fromUrl)) {
        return fromUrl;
      }
    } catch (_) { /* ignore */ }

    if (!forceAuto) {
      try {
        const stored = localStorage.getItem(STORAGE_NAME);
        if (stored && SUPPORTED.includes(stored)) return stored;
      } catch (_) { /* ignore */ }
    }

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

  // ── Mini-parseur HTML pour le contenu rich (data-i18n-html) ───
  // On n'utilise PAS innerHTML / DOMParser / createContextualFragment :
  // chaque nœud est construit via document.createElement + appendChild
  // après tokenisation à la main. Seules les balises listées dans
  // ALLOWED_TAGS et les attributs listés dans ALLOWED_ATTRS / GLOBAL_ATTRS
  // sont rendus ; tout le reste est aplati en texte. C'est suffisant pour
  // les balises utilisées dans data/i18n.json (<strong>, <em>, <s>, <br>,
  // <span class>, <a href target rel>) et garantit l'absence de chemin
  // d'injection HTML/script même si le dictionnaire était compromis.
  const ALLOWED_TAGS = new Set(['STRONG', 'EM', 'B', 'I', 'S', 'BR', 'SPAN', 'A']);
  const VOID_TAGS = new Set(['BR']);
  const GLOBAL_ATTRS = ['class', 'id'];
  const ALLOWED_ATTRS = new Map([
    ['A',    ['href', 'target', 'rel']],
    ['SPAN', []],
  ]);
  const SAFE_URL_RE = /^(?:(?:https?:|mailto:|tel:|#|\/)|[^:?#]+\.html(?:\?|#|$)|[^:?#]+(?:\?|#))/i;
  const ENTITY_RE = /&(amp|lt|gt|quot|#39|apos|nbsp|laquo|raquo|hellip|mdash|ndash);/g;
  const ENTITY_MAP = new Map([
    ['amp', '&'], ['lt', '<'], ['gt', '>'],
    ['quot', '"'], ['#39', "'"], ['apos', "'"],
    ['nbsp', ' '], ['laquo', '«'], ['raquo', '»'],
    ['hellip', '…'], ['mdash', '—'], ['ndash', '–'],
  ]);

  function decodeEntities(s) {
    return String(s).replace(ENTITY_RE, function (_, name) {
      const v = ENTITY_MAP.get(name);
      return v != null ? v : _;
    });
  }

  // Découpe une chaîne HTML simple en jetons {type:'text'|'open'|'close', ...}.
  // Hypothèses (vérifiées par les contenus de data/i18n.json) : pas de
  // commentaires, pas de CDATA, attributs entre guillemets, pas de '>' dans
  // les valeurs.
  function tokenize(html) {
    const tokens = [];
    const s = String(html);
    let i = 0;
    while (i < s.length) {
      const lt = s.indexOf('<', i);
      if (lt < 0) {
        tokens.push({ type: 'text', value: s.slice(i) });
        break;
      }
      if (lt > i) tokens.push({ type: 'text', value: s.slice(i, lt) });
      const gt = s.indexOf('>', lt);
      if (gt < 0) break;
      const raw = s.slice(lt + 1, gt).trim();
      if (raw.startsWith('/')) {
        tokens.push({ type: 'close', name: raw.slice(1).trim().toUpperCase() });
      } else {
        let body = raw;
        let selfClose = false;
        if (body.endsWith('/')) { selfClose = true; body = body.slice(0, -1).trim(); }
        const sp = body.search(/\s/);
        const name = (sp < 0 ? body : body.slice(0, sp)).toUpperCase();
        const attrsStr = sp < 0 ? '' : body.slice(sp + 1);
        const attrs = new Map();
        const attrRe = /([A-Za-z_][\w-]*)\s*=\s*"([^"]*)"/g;
        let m;
        while ((m = attrRe.exec(attrsStr)) !== null) {
          attrs.set(m[1].toLowerCase(), decodeEntities(m[2]));
        }
        tokens.push({ type: 'open', name, attrs, selfClose: selfClose || VOID_TAGS.has(name) });
      }
      i = gt + 1;
    }
    return tokens;
  }

  function buildFragment(html) {
    const tokens = tokenize(html);
    const frag = document.createDocumentFragment();
    const stack = [frag];
    for (const tok of tokens) {
      const parent = stack[stack.length - 1];
      if (tok.type === 'text') {
        parent.appendChild(document.createTextNode(decodeEntities(tok.value)));
        continue;
      }
      if (tok.type === 'open') {
        if (!ALLOWED_TAGS.has(tok.name)) {
          if (!tok.selfClose) stack.push(parent);
          continue;
        }
        const el = document.createElement(tok.name);
        const tagAttrs = ALLOWED_ATTRS.get(tok.name) || [];
        const allAttrs = new Set([...tagAttrs, ...GLOBAL_ATTRS]);
        for (const attr of allAttrs) {
          if (!tok.attrs.has(attr)) continue;
          const value = tok.attrs.get(attr);
          if (tok.name === 'A' && attr === 'href' && !SAFE_URL_RE.test(value)) continue;
          el.setAttribute(attr, value);
        }
        parent.appendChild(el);
        if (!tok.selfClose) stack.push(el);
        continue;
      }
      if (tok.type === 'close' && stack.length > 1) {
        stack.pop();
      }
    }
    return frag;
  }

  function setRichContent(el, html) {
    el.replaceChildren(buildFragment(html));
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

  function applyAndDispatch() {
    applyTo(document);
    document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { locale: state.locale } }));
  }

  const ready = fetch(DICT_URL)
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(raw => {
      state.dict = buildDict(raw);
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAndDispatch, { once: true });
      } else {
        applyAndDispatch();
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
