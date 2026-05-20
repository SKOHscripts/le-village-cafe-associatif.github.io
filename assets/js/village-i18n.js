(function () {
  'use strict';

  const SUPPORTED = ['fr', 'en'];
  const DEFAULT   = 'fr';
  const LOCALE_PREF = 'village-lang';

  // ── Safe rich-text renderer ──────────────────────────────────────────────
  // Builds DOM nodes from a developer-authored HTML string using only
  // createElement/createTextNode — no innerHTML, no DOMParser.
  // Only tags and attributes in the allowlists are rendered; everything
  // else is flattened to text, making script injection impossible.
  const ALLOWED_TAGS  = new Set(['STRONG', 'EM', 'B', 'I', 'S', 'BR', 'SPAN', 'A']);
  const VOID_TAGS     = new Set(['BR']);
  const GLOBAL_ATTRS  = ['class', 'id'];
  const ALLOWED_ATTRS = new Map([['A', ['href', 'target', 'rel']], ['SPAN', []]]);
  const SAFE_URL_RE   = /^(?:(?:https?:|mailto:|tel:|#|\/)|[^:?#]+\.html(?:\?|#|$)|[^:?#]+(?:\?|#))/i;
  const ENTITY_RE     = /&(amp|lt|gt|quot|#39|apos|nbsp|laquo|raquo|hellip|mdash|ndash);/g;
  const ENTITY_MAP    = new Map([
    ['amp','&'],['lt','<'],['gt','>'],['quot','"'],['#39',"'"],['apos',"'"],
    ['nbsp',' '],['laquo','«'],['raquo','»'],['hellip','…'],['mdash','—'],['ndash','–'],
  ]);
  const ATTR_RE = /([A-Za-z_][\w-]*)\s*=\s*"([^"]*)"/g;

  function decodeEntities(s) {
    return String(s).replace(ENTITY_RE, function (_, n) { const v = ENTITY_MAP.get(n); return v != null ? v : _; });
  }

  function tokenize(source) {
    const tokens = [], s = source == null ? '' : String(source);
    let i = 0;
    while (i < s.length) {
      const lt = s.indexOf('<', i);
      if (lt < 0) { tokens.push({ type: 'text', value: s.slice(i) }); break; }
      if (lt > i) tokens.push({ type: 'text', value: s.slice(i, lt) });
      const gt = s.indexOf('>', lt);
      if (gt < 0) break;
      const raw = s.slice(lt + 1, gt).trim();
      if (raw.startsWith('/')) {
        tokens.push({ type: 'close', name: raw.slice(1).trim().toUpperCase() });
      } else {
        let body = raw, selfClose = false;
        if (body.endsWith('/')) { selfClose = true; body = body.slice(0, -1).trim(); }
        const sp = body.search(/\s/);
        const name = (sp < 0 ? body : body.slice(0, sp)).toUpperCase();
        const attrsStr = sp < 0 ? '' : body.slice(sp + 1);
        const attrs = new Map();
        for (const m of attrsStr.matchAll(ATTR_RE)) attrs.set(m[1].toLowerCase(), decodeEntities(m[2]));
        tokens.push({ type: 'open', name, attrs, selfClose: selfClose || VOID_TAGS.has(name) });
      }
      i = gt + 1;
    }
    return tokens;
  }

  function buildFragment(source) {
    const frag = document.createDocumentFragment(), stack = [frag];
    for (const tok of tokenize(source)) {
      const parent = stack[stack.length - 1];
      if (tok.type === 'text') { parent.appendChild(document.createTextNode(decodeEntities(tok.value))); continue; }
      if (tok.type === 'open') {
        if (!ALLOWED_TAGS.has(tok.name)) { if (!tok.selfClose) stack.push(parent); continue; }
        const node = document.createElement(tok.name);
        const allowed = new Set([...(ALLOWED_ATTRS.get(tok.name) || []), ...GLOBAL_ATTRS]);
        for (const attr of allowed) {
          if (!tok.attrs.has(attr)) continue;
          const v = tok.attrs.get(attr);
          if (tok.name === 'A' && attr === 'href' && !SAFE_URL_RE.test(v)) continue;
          node.setAttribute(attr, v);
        }
        parent.appendChild(node);
        if (!tok.selfClose) stack.push(node);
        continue;
      }
      if (tok.type === 'close' && stack.length > 1) stack.pop();
    }
    return frag;
  }
  // ────────────────────────────────────────────────────────────────────────

  function detectLocale() {
    try {
      const params  = new URLSearchParams(window.location.search);
      const fromUrl = params.get('lang');
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

  // On the index page, when no language is stored and no ?lang param is present,
  // reflect ?lang=auto in the URL so the behaviour is visible and shareable.
  (function reflectAutoOnIndex() {
    try {
      const path = window.location.pathname;
      if (path !== '/' && path !== '' && !path.endsWith('/index.html')) return;
      const url = new URL(window.location.href);
      if (url.searchParams.has('lang')) return;
      let stored = null;
      try { stored = localStorage.getItem(LOCALE_PREF); } catch (_) {}
      if (stored) return;
      url.searchParams.set('lang', 'auto');
      history.replaceState(null, '', url.pathname + '?' + url.searchParams.toString() + url.hash);
    } catch (_) {}
  }());

  function applyLang(lang, persist) {
    currentLang = lang;
    if (persist !== false) {
      try { localStorage.setItem(LOCALE_PREF, lang); } catch (_) {}
      // If the URL still carries ?lang=auto (from auto-detection), clear it
      // now that the user has made an explicit choice.
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('lang') === 'auto') {
          url.searchParams.delete('lang');
          const qs = url.searchParams.toString();
          history.replaceState(null, '', url.pathname + (qs ? '?' + qs : '') + url.hash);
        }
      } catch (_) {}
    }

    document.documentElement.lang = lang;

    document.querySelectorAll('[data-fr]').forEach(el => {
      const text = lang === 'en' ? el.dataset.en : el.dataset.fr;
      if (text !== undefined) el.textContent = text;
    });

    document.querySelectorAll('[data-fr-html]').forEach(el => {
      if (el.dataset.frHtml !== undefined) {
        el.replaceChildren(buildFragment(lang === 'en' ? el.dataset.enHtml : el.dataset.frHtml));
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
