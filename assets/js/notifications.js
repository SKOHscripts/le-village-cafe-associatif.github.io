/* =============================================
   LE VILLAGE — notifications.js
   Cloche de la barre haute : informations du café qui ne sont pas des
   évènements (mise à jour du site, changement d'horaire…).

   Les notifications viennent de la table Supabase `notifications`, lue en
   REST (pas de SDK : la cloche vit sur toutes les pages, dont celles qui
   n'ont pas besoin de @supabase/supabase-js). La rétention de 3 mois est
   portée par la policy RLS ; le filtre ci-dessous n'est qu'une ceinture.

   Le bouton est injecté dans la barre haute par ce script : la nav est
   recopiée dans les 10 pages du site, mieux vaut un seul point de vérité.
   ============================================= */

/* jshint browser: true, devel: true */
/* globals fetch */
(function () {
  'use strict';

  const READ_KEY = 'village-notifs-read';
  const MAX_ITEMS = 30;
  const RETENTION_DAYS = 92;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function currentLocale() {
    return (window.i18n && window.i18n.locale) || document.documentElement.lang || 'fr';
  }

  // Lookup par Map plutôt que par propriété d'objet dynamique (sink d'injection).
  const I18N_STRINGS = new Map([
    ['notif.bell',      { fr: 'Notifications',                        en: 'Notifications' }],
    ['notif.bell.new',  { fr: 'Notifications — nouveautés à lire',    en: 'Notifications — unread items' }],
    ['notif.title',     { fr: 'Notifications',                        en: 'Notifications' }],
    ['notif.unread',    { fr: 'Non lue',                              en: 'Unread' }],
    ['notif.link',      { fr: 'En savoir plus',                       en: 'Learn more' }],
    ['notif.today',     { fr: "Aujourd'hui",                          en: 'Today' }],
    ['notif.yesterday', { fr: 'Hier',                                 en: 'Yesterday' }],
    ['notif.daysAgo',   { fr: 'Il y a {n} jours',                     en: '{n} days ago' }],
    ['common.close',    { fr: 'Fermer',                               en: 'Close' }],
  ]);

  function t(key, fallback) {
    const entry = I18N_STRINGS.get(key);
    if (!entry) return fallback;
    return (currentLocale() === 'en' ? entry.en : entry.fr) || entry.fr || fallback;
  }

  // ── Icônes ───────────────────────────────────────────────────
  // Tracés au format Feather (stroke, viewBox 24). Une clé inconnue
  // retombe sur « info », et la base interdit déjà les autres valeurs.
  const ICONS = new Map([
    ['info', [
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['line', { x1: '12', y1: '16', x2: '12', y2: '12' }],
      ['line', { x1: '12', y1: '8', x2: '12.01', y2: '8' }],
    ]],
    ['horaire', [
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['polyline', { points: '12 6 12 12 16 14' }],
    ]],
    ['site', [
      ['rect', { x: '2', y: '3', width: '20', height: '14', rx: '2', ry: '2' }],
      ['line', { x1: '8', y1: '21', x2: '16', y2: '21' }],
      ['line', { x1: '12', y1: '17', x2: '12', y2: '21' }],
    ]],
    ['evenement', [
      ['rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }],
      ['line', { x1: '16', y1: '2', x2: '16', y2: '6' }],
      ['line', { x1: '8', y1: '2', x2: '8', y2: '6' }],
      ['line', { x1: '3', y1: '10', x2: '21', y2: '10' }],
    ]],
    ['alerte', [
      ['path', { d: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }],
      ['line', { x1: '12', y1: '9', x2: '12', y2: '13' }],
      ['line', { x1: '12', y1: '17', x2: '12.01', y2: '17' }],
    ]],
    ['cloche', [
      ['path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }],
      ['path', { d: 'M13.73 21a2 2 0 0 1-3.46 0' }],
    ]],
  ]);

  function makeIcon(key, className) {
    const shapes = ICONS.get(key) || ICONS.get('info');
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    if (className) svg.setAttribute('class', className);
    shapes.forEach(([tag, attrs]) => {
      const node = document.createElementNS(SVG_NS, tag);
      Object.keys(attrs).forEach(name => node.setAttribute(name, attrs[name]));
      svg.appendChild(node);
    });
    return svg;
  }

  // ── Notifications lues (par navigateur, pas de compte sur le site) ──
  function readIds() {
    try {
      const raw = localStorage.getItem(READ_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string') : [];
    } catch (_) {
      return [];
    }
  }

  function persistReadIds(ids) {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(ids));
    } catch (_) {
      // Navigation privée ou stockage refusé : tout reste « non lu », sans casse.
    }
  }

  // ── Chargement ───────────────────────────────────────────────
  function metaContent(name) {
    const el = document.querySelector('meta[name="' + name + '"]');
    const value = el ? el.getAttribute('content') : null;
    return value && value.trim() ? value.trim() : null;
  }

  function normalize(row) {
    return {
      id: String(row.id),
      titre: row.titre,
      titre_en: row.titre_en,
      resume: row.resume,
      resume_en: row.resume_en,
      texte: row.texte,
      texte_en: row.texte_en,
      icone: typeof row.icone === 'string' ? row.icone : 'info',
      lien: row.lien,
      lienLabel: row.lien_label,
      lienLabel_en: row.lien_label_en,
      epingle: row.epingle === true,
      datePublication: row.date_publication,
    };
  }

  function isFresh(notif, now) {
    const published = Date.parse(notif.datePublication);
    if (isNaN(published)) return false;
    if (published > now.getTime()) return false;
    return now.getTime() - published <= RETENTION_DAYS * MS_PER_DAY;
  }

  function fetchNotifications() {
    const base = metaContent('supabase-url');
    const key = metaContent('supabase-anon-key');
    if (!base || !key) return Promise.resolve([]);

    const url = base.replace(/\/+$/, '')
      + '/rest/v1/notifications'
      + '?select=id,titre,titre_en,resume,resume_en,texte,texte_en,icone,lien,lien_label,lien_label_en,epingle,date_publication'
      + '&visible=eq.true'
      + '&order=epingle.desc,date_publication.desc'
      + '&limit=' + MAX_ITEMS;

    return fetch(url, {
      headers: { apikey: key, Authorization: 'Bearer ' + key, Accept: 'application/json' },
    })
      .then(res => (res.ok ? res.json() : []))
      .then(rows => {
        const now = new Date();
        return (Array.isArray(rows) ? rows : []).map(normalize).filter(n => isFresh(n, now));
      })
      .catch(() => []);
    // Base injoignable : pas de cloche du tout, plutôt qu'une erreur dans la barre.
  }

  // ── Champs traduits ──────────────────────────────────────────
  function localizedField(notif, kind) {
    const en = currentLocale() === 'en';
    let fr;
    let translated;
    switch (kind) {
      case 'titre':  fr = notif.titre;      translated = notif.titre_en;      break;
      case 'resume': fr = notif.resume;     translated = notif.resume_en;     break;
      case 'texte':  fr = notif.texte;      translated = notif.texte_en;      break;
      case 'lien':   fr = notif.lienLabel;  translated = notif.lienLabel_en;  break;
      default: return '';
    }
    if (en && translated != null && String(translated).trim() !== '') return String(translated);
    return fr == null ? '' : String(fr);
  }

  function localMidnight(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  function formatDate(iso) {
    const published = Date.parse(iso);
    if (isNaN(published)) return '';
    // De minuit à minuit : sinon une publication d'avant-hier 17h passerait
    // pour « hier » dès qu'on la consulte le matin.
    const days = Math.round((localMidnight(new Date()) - localMidnight(new Date(published))) / MS_PER_DAY);
    if (days <= 0) return t('notif.today', "Aujourd'hui");
    if (days === 1) return t('notif.yesterday', 'Hier');
    if (days < 7) return t('notif.daysAgo', 'Il y a {n} jours').replace('{n}', String(days));
    const tag = currentLocale() === 'en' ? 'en-GB' : 'fr-FR';
    return new Date(published).toLocaleDateString(tag, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Pop-up « article » ───────────────────────────────────────
  function trapFocus(container, event) {
    if (event.key !== 'Tab') return;
    const focusables = container.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openArticle(notif, onClosed) {
    const previouslyFocused = document.activeElement;

    const overlay = document.createElement('div');
    overlay.className = 'notif-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'notif-modal-title');

    const modal = document.createElement('div');
    modal.className = 'notif-modal';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'notif-modal__close';
    closeBtn.setAttribute('aria-label', t('common.close', 'Fermer'));
    closeBtn.textContent = '✕';

    const head = document.createElement('div');
    head.className = 'notif-modal__head';

    const badge = document.createElement('span');
    badge.className = 'notif-modal__icon';
    badge.appendChild(makeIcon(notif.icone));

    const heading = document.createElement('div');

    const date = document.createElement('p');
    date.className = 'notif-modal__date';
    date.textContent = formatDate(notif.datePublication);

    const titre = document.createElement('h2');
    titre.className = 'notif-modal__title';
    titre.id = 'notif-modal-title';
    titre.textContent = localizedField(notif, 'titre');

    heading.append(date, titre);
    head.append(badge, heading);

    const resume = document.createElement('p');
    resume.className = 'notif-modal__resume';
    resume.textContent = localizedField(notif, 'resume');

    const texte = document.createElement('p');
    texte.className = 'notif-modal__text';
    texte.textContent = localizedField(notif, 'texte');

    modal.append(closeBtn, head, resume, texte);

    if (typeof notif.lien === 'string' && /^https:\/\//i.test(notif.lien)) {
      const link = document.createElement('a');
      link.className = 'btn btn-amber notif-modal__cta';
      link.href = notif.lien;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = localizedField(notif, 'lien').trim() || t('notif.link', 'En savoir plus');
      modal.appendChild(link);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.classList.add('has-notif-modal');
    closeBtn.focus();

    function cleanup() {
      overlay.remove();
      document.body.classList.remove('has-notif-modal');
      document.removeEventListener('keydown', onKeydown);
      // La ligne cliquée est masquée avec le panneau : on rend le focus à la
      // cloche plutôt qu'au <body>.
      const stillVisible = previouslyFocused
        && document.contains(previouslyFocused)
        && previouslyFocused.offsetParent !== null;
      const target = stillVisible ? previouslyFocused : document.getElementById('notif-bell');
      if (target && target.focus) target.focus();
      if (typeof onClosed === 'function') onClosed();
    }

    function close() {
      if (modal.classList.contains('is-closing')) return;
      modal.classList.add('is-closing');
      overlay.classList.add('is-closing');
      const fallbackTimer = setTimeout(cleanup, 350);
      modal.addEventListener('animationend', () => {
        clearTimeout(fallbackTimer);
        cleanup();
      }, { once: true });
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab') {
        trapFocus(modal, e);
      }
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKeydown);
  }

  // ── Cloche + panneau ─────────────────────────────────────────
  function mountPoint() {
    return document.querySelector('.site-nav .nav-right');
  }

  function build(notifications) {
    const host = mountPoint();
    if (!host || !notifications.length) return null;

    let read = readIds();
    // Les notifications expirées sortent du stockage en même temps que de la base.
    const liveIds = notifications.map(n => n.id);
    const pruned = read.filter(id => liveIds.indexOf(id) !== -1);
    if (pruned.length !== read.length) {
      read = pruned;
      persistReadIds(read);
    }

    const root = document.createElement('div');
    root.className = 'notif';

    const bell = document.createElement('button');
    bell.type = 'button';
    bell.className = 'notif-bell';
    bell.id = 'notif-bell';
    bell.setAttribute('aria-haspopup', 'dialog');
    bell.setAttribute('aria-expanded', 'false');
    bell.setAttribute('aria-controls', 'notif-panel');
    bell.appendChild(makeIcon('cloche', 'notif-bell__icon'));

    const dot = document.createElement('span');
    dot.className = 'notif-dot';
    dot.setAttribute('aria-hidden', 'true');
    bell.appendChild(dot);

    const panel = document.createElement('div');
    panel.className = 'notif-panel';
    panel.id = 'notif-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'notif-panel-title');
    panel.hidden = true;

    const panelTitle = document.createElement('p');
    panelTitle.className = 'notif-panel__title';
    panelTitle.id = 'notif-panel-title';

    const list = document.createElement('ul');
    list.className = 'notif-list';

    panel.append(panelTitle, list);
    root.append(bell, panel);

    // Avant le sélecteur de langue quand il existe, sinon en tête de la zone.
    const langSwitch = host.querySelector('.lang-switch');
    if (langSwitch) host.insertBefore(root, langSwitch);
    else host.insertBefore(root, host.firstChild);

    function isRead(notif) {
      return read.indexOf(notif.id) !== -1;
    }

    function markRead(notif) {
      if (isRead(notif)) return;
      read = read.concat([notif.id]);
      persistReadIds(read);
      refresh();
    }

    function buildItem(notif) {
      const item = document.createElement('li');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'notif-item' + (isRead(notif) ? '' : ' is-unread');

      const icon = document.createElement('span');
      icon.className = 'notif-item__icon';
      icon.appendChild(makeIcon(notif.icone));

      const body = document.createElement('span');
      body.className = 'notif-item__body';

      const titre = document.createElement('span');
      titre.className = 'notif-item__title';
      titre.textContent = localizedField(notif, 'titre');

      const resume = document.createElement('span');
      resume.className = 'notif-item__resume';
      resume.textContent = localizedField(notif, 'resume');

      const date = document.createElement('span');
      date.className = 'notif-item__date';
      date.textContent = formatDate(notif.datePublication);

      body.append(titre, resume, date);
      btn.append(icon, body);

      if (!isRead(notif)) {
        const mark = document.createElement('span');
        mark.className = 'notif-item__dot';
        mark.setAttribute('title', t('notif.unread', 'Non lue'));
        btn.appendChild(mark);
      }

      btn.addEventListener('click', () => {
        closePanel(false);
        openArticle(notif, () => markRead(notif));
      });

      item.appendChild(btn);
      return item;
    }

    function refresh() {
      const unread = notifications.filter(n => !isRead(n)).length;
      panelTitle.textContent = t('notif.title', 'Notifications');
      bell.setAttribute(
        'aria-label',
        unread ? t('notif.bell.new', 'Notifications — nouveautés à lire') : t('notif.bell', 'Notifications')
      );
      root.classList.toggle('has-unread', unread > 0);
      list.replaceChildren(...notifications.map(buildItem));
    }

    function openPanel() {
      panel.hidden = false;
      root.classList.add('is-open');
      bell.setAttribute('aria-expanded', 'true');
      bell.classList.add('is-ringing');
      bell.addEventListener('animationend', () => bell.classList.remove('is-ringing'), { once: true });
      document.addEventListener('click', onDocumentClick, true);
      document.addEventListener('keydown', onPanelKeydown);
    }

    function closePanel(restoreFocus) {
      if (panel.hidden) return;
      panel.hidden = true;
      root.classList.remove('is-open');
      bell.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocumentClick, true);
      document.removeEventListener('keydown', onPanelKeydown);
      if (restoreFocus !== false) bell.focus();
    }

    function onDocumentClick(e) {
      if (!root.contains(e.target)) closePanel(false);
    }

    function onPanelKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel(true);
      } else if (e.key === 'Tab') {
        trapFocus(root, e);
      }
    }

    bell.addEventListener('click', () => {
      if (panel.hidden) openPanel();
      else closePanel(true);
    });

    refresh();
    return { refresh: refresh, close: () => closePanel(false) };
  }

  // ── Initialisation ───────────────────────────────────────────
  function init() {
    if (!mountPoint()) return;
    fetchNotifications().then(notifications => {
      const widget = build(notifications);
      if (!widget) return;
      document.addEventListener('i18n:changed', () => {
        widget.close();
        const openModal = document.querySelector('.notif-modal-overlay');
        if (openModal) {
          openModal.remove();
          document.body.classList.remove('has-notif-modal');
        }
        widget.refresh();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
