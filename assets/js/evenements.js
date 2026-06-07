/* =============================================
   LE VILLAGE — evenements.js
   Chargement + rendu des évènements (à venir / passés)
   + pop-up automatique sur la page d'accueil
   ============================================= */

(function () {
  'use strict';

  const POPUP_WINDOW_DAYS = 21;
  const DISMISS_NAMESPACE = 'evt-dismissed:';
  const FALLBACK_FB = 'https://www.facebook.com/LeVillageLyon8/';
  const FALLBACK_IG = 'https://www.instagram.com/cafe_associatif_le_village';
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function currentLocale() {
    return (window.i18n && window.i18n.locale) || 'fr';
  }

  const I18N_STRINGS = {
    'event.from':          { fr: 'dès',                              en: 'from' },
    'event.alt.prefix':    { fr: 'Photo de l’événement',            en: 'Event photo' },
    'event.popup.eyebrow': { fr: 'Prochainement au Village',        en: 'Coming up at Le Village' },
    'event.popup.fallback':{ fr: 'Évènement',                       en: 'Event' },
    'event.popup.agenda':  { fr: "Voir l'agenda →",                 en: 'See agenda →' },
    'event.popup.prev':    { fr: 'Évènement précédent',             en: 'Previous event' },
    'event.popup.next':    { fr: 'Évènement suivant',               en: 'Next event' },
    'event.empty.upcoming':{ fr: "Pas d'évènement prévu pour l'instant.", en: 'No upcoming events for now.' },
    'event.empty.past':    { fr: "Pas d'évènement passé à afficher.",     en: 'No past events to show.' },
    'common.close':        { fr: 'Fermer',                          en: 'Close' },
  };

  function t(key, fallback) {
    const entry = I18N_STRINGS[key];
    if (entry) return entry[currentLocale()] || entry.fr || fallback;
    return fallback;
  }

  // ── Utilitaires date ─────────────────────────────────────────
  function toLocalMidnight(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return null;
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  }

  function startOfToday(now) {
    const d = now || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function formatEventDate(iso) {
    const d = toLocalMidnight(iso);
    if (!d) return '';
    const tag = currentLocale() === 'en' ? 'en-GB' : 'fr-FR';
    return d.toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function formatHoraires(evt) {
    if (evt.heureDebut && evt.heureFin) return `${evt.heureDebut} – ${evt.heureFin}`;
    if (evt.heureDebut) return `${t('event.from', 'dès')} ${evt.heureDebut}`;
    return '';
  }

  function localizedField(evt, kind) {
    if (!evt) return '';
    const en = currentLocale() === 'en';
    let fr;
    let translated;
    switch (kind) {
      case 'titre':       fr = evt.titre;       translated = evt.titre_en;       break;
      case 'lieu':        fr = evt.lieu;        translated = evt.lieu_en;        break;
      case 'description': fr = evt.description; translated = evt.description_en; break;
      default: return '';
    }
    if (en && translated != null && String(translated).trim() !== '') return translated;
    return fr || '';
  }

  // ── Chargement ───────────────────────────────────────────────
  function loadEvents() {
    return fetch('data/evenements.json')
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(err => {
        console.warn('[evenements] chargement impossible :', err);
        return [];
      });
  }

  // ── Tri & sélection ──────────────────────────────────────────
  function splitEvents(events, now) {
    const today = startOfToday(now);
    const upcoming = [];
    const past = [];
    for (const e of events) {
      const d = toLocalMidnight(e.date);
      if (!d) continue;
      if (d.getTime() >= today.getTime()) upcoming.push(e);
      else past.push(e);
    }
    upcoming.sort((a, b) => toLocalMidnight(a.date) - toLocalMidnight(b.date));
    past.sort((a, b) => toLocalMidnight(b.date) - toLocalMidnight(a.date));
    return { upcoming, past };
  }

  function pickPopupCandidates(upcoming, now) {
    const today = startOfToday(now);
    return upcoming.filter(evt => {
      const d = toLocalMidnight(evt.date);
      if (!d) return false;
      const diffDays = Math.round((d.getTime() - today.getTime()) / MS_PER_DAY);
      return diffDays >= 0 && diffDays <= POPUP_WINDOW_DAYS;
    });
  }

  function altForEvent(evt) {
    if (evt.photo_alt) return evt.photo_alt;
    const titre = localizedField(evt, 'titre');
    const prefix = t('event.alt.prefix', 'Photo de l’événement');
    return titre ? `${prefix} : ${titre}` : prefix;
  }

  // ── Rendu listes (DOM safe) ──────────────────────────────────
  function buildEventCard(evt) {
    const card = document.createElement('article');
    card.className = 'evenement-card';

    if (evt.photos && evt.photos.length && isSafeUrl(evt.photos[0])) {
      const photoWrap = document.createElement('div');
      photoWrap.className = 'evenement-photo';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.className = 'js-zoomable';
      img.alt = altForEvent(evt);
      img.src = evt.photos[0];
      img.addEventListener('error', () => { photoWrap.style.display = 'none'; });
      photoWrap.appendChild(img);
      card.appendChild(photoWrap);
    }

    const body = document.createElement('div');
    body.className = 'evenement-body';

    const dateEl = document.createElement('p');
    dateEl.className = 'evenement-date';
    dateEl.textContent = formatEventDate(evt.date);
    body.appendChild(dateEl);

    const titre = document.createElement('h3');
    titre.className = 'evenement-titre';
    titre.textContent = localizedField(evt, 'titre');
    body.appendChild(titre);

    const horaires = formatHoraires(evt);
    if (horaires) {
      const h = document.createElement('p');
      h.className = 'evenement-meta';
      h.textContent = horaires;
      body.appendChild(h);
    }

    const lieu = localizedField(evt, 'lieu');
    if (lieu) {
      const el = document.createElement('p');
      el.className = 'evenement-meta';
      el.textContent = lieu;
      body.appendChild(el);
    }

    const description = localizedField(evt, 'description');
    if (description) {
      const desc = document.createElement('p');
      desc.className = 'evenement-desc';
      desc.textContent = description;
      body.appendChild(desc);
    }

    card.appendChild(body);
    return card;
  }

  function renderList(container, events, emptyMessage) {
    if (!container) return;
    container.replaceChildren();
    if (!events.length) {
      const empty = document.createElement('p');
      empty.className = 'evenements-empty';
      empty.textContent = emptyMessage;
      container.appendChild(empty);
      return;
    }
    for (const evt of events) container.appendChild(buildEventCard(evt));
  }

  // ── Pop-up ───────────────────────────────────────────────────
  function isDismissed(evt) {
    try {
      return sessionStorage.getItem(DISMISS_NAMESPACE + evt.id) === '1';
    } catch {
      return false;
    }
  }

  function markDismissed(evt) {
    try {
      sessionStorage.setItem(DISMISS_NAMESPACE + evt.id, '1');
    } catch {
      // sessionStorage indisponible (mode privé strict) — ignoré volontairement
    }
  }

  function isSafeUrl(url) {
    if (typeof url !== 'string') return false;
    return /^https?:\/\//i.test(url)
      || /^[^:]+\.html(\?|#|$)/i.test(url)
      || /^assets\/images\/[^/]+\.(jpe?g|png|gif|webp|svg)$/i.test(url);
  }

  function isSafeEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function buildConfirmationNotice(evt, className) {
    if (!isSafeEmail(evt.confirmationMail)) return null;
    const en = currentLocale() === 'en';
    const p = document.createElement('p');
    p.className = className;

    const mark = document.createElement('span');
    mark.className = className + '-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '✨';
    p.appendChild(mark);

    const text = document.createElement('span');
    text.appendChild(document.createTextNode(
      en ? 'Please confirm your attendance by ' : 'Merci de confirmer votre présence par '
    ));

    const a = document.createElement('a');
    const titre = localizedField(evt, 'titre');
    const subjectBase = en ? 'Attendance confirmation' : 'Confirmation de présence';
    const subject = titre ? subjectBase + ' — ' + titre : subjectBase;
    a.href = 'mailto:' + evt.confirmationMail + '?subject=' + encodeURIComponent(subject);
    a.textContent = en ? 'email' : 'mail';
    text.appendChild(a);

    p.appendChild(text);
    return p;
  }

  function buildExternalLink(href, label, className) {
    const a = document.createElement('a');
    a.setAttribute('rel', 'noopener noreferrer');
    a.setAttribute('target', '_blank');
    a.setAttribute('href', href);
    a.className = className;
    a.textContent = label;
    return a;
  }

  function trapFocus(container, event) {
    if (event.key !== 'Tab') return;
    const focusables = container.querySelectorAll(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
    );
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

  function buildModalContent(evt) {
    const frag = document.createDocumentFragment();

    const eyebrow = document.createElement('p');
    eyebrow.className = 'event-modal__eyebrow';
    eyebrow.textContent = t('event.popup.eyebrow', 'Prochainement au Village');

    const titre = document.createElement('h2');
    titre.id = 'evt-popup-title';
    titre.className = 'event-modal__title';
    titre.textContent = localizedField(evt, 'titre') || t('event.popup.fallback', 'Évènement');

    const date = document.createElement('p');
    date.className = 'event-modal__date';
    const dateParts = [formatEventDate(evt.date)];
    const horaires = formatHoraires(evt);
    if (horaires) dateParts.push(horaires);
    date.textContent = dateParts.join(' · ');

    frag.append(eyebrow, titre, date);

    if (evt.photos && evt.photos.length && isSafeUrl(evt.photos[0])) {
      const photoWrap = document.createElement('div');
      photoWrap.className = 'event-modal__photo';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.className = 'js-zoomable';
      img.alt = altForEvent(evt);
      img.src = evt.photos[0];
      img.addEventListener('error', () => { photoWrap.style.display = 'none'; });
      photoWrap.appendChild(img);
      frag.appendChild(photoWrap);
    }

    const lieu = localizedField(evt, 'lieu');
    if (lieu) {
      const el = document.createElement('p');
      el.className = 'event-modal__lieu';
      el.textContent = lieu;
      frag.appendChild(el);
    }

    const description = localizedField(evt, 'description');
    if (description) {
      const desc = document.createElement('p');
      desc.className = 'event-modal__desc';
      desc.textContent = description;
      frag.appendChild(desc);
    }

    const confirmNotice = buildConfirmationNotice(evt, 'event-modal__confirm');
    if (confirmNotice) frag.appendChild(confirmNotice);

    const links = document.createElement('div');
    links.className = 'event-modal__links';

    const candidateFb = (evt.liens && evt.liens.facebook) || FALLBACK_FB;
    const candidateIg = (evt.liens && evt.liens.instagram) || FALLBACK_IG;
    const fbUrl = isSafeUrl(candidateFb) ? candidateFb : FALLBACK_FB;
    const igUrl = isSafeUrl(candidateIg) ? candidateIg : FALLBACK_IG;

    const fb = buildExternalLink(fbUrl, 'Facebook', 'event-modal__link event-modal__link--fb');
    const ig = buildExternalLink(igUrl, 'Instagram', 'event-modal__link event-modal__link--ig');

    const agenda = document.createElement('a');
    agenda.href = 'agenda.html';
    agenda.className = 'event-modal__link event-modal__link--agenda';
    agenda.textContent = t('event.popup.agenda', "Voir l'agenda →");

    links.append(fb, ig, agenda);
    frag.appendChild(links);

    return frag;
  }

  function showEventPopup(events) {
    if (!events || !events.length) return;
    const candidates = events.filter(e => !isDismissed(e));
    if (!candidates.length) return;

    let currentIndex = 0;
    const previouslyFocused = document.activeElement;

    const overlay = document.createElement('div');
    overlay.className = 'event-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'evt-popup-title');

    const shell = document.createElement('div');
    shell.className = 'event-modal-shell';

    const modal = document.createElement('div');
    modal.className = 'event-modal';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'event-modal__close';
    closeBtn.setAttribute('aria-label', t('common.close', 'Fermer'));
    closeBtn.textContent = '✕';

    const contentArea = document.createElement('div');
    contentArea.className = 'event-modal__body';

    modal.append(closeBtn, contentArea);
    shell.appendChild(modal);

    let prevBtn = null;
    let nextBtn = null;
    let counter = null;

    function makeSvgArrow(points) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'event-modal__nav-arrow');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2.5');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      poly.setAttribute('points', points);
      svg.appendChild(poly);
      return svg;
    }

    if (candidates.length > 1) {
      prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'event-modal__nav-btn event-modal__nav-btn--prev';
      prevBtn.setAttribute('aria-label', t('event.popup.prev', 'Évènement précédent'));
      prevBtn.appendChild(makeSvgArrow('15 18 9 12 15 6'));

      nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'event-modal__nav-btn event-modal__nav-btn--next';
      nextBtn.setAttribute('aria-label', t('event.popup.next', 'Évènement suivant'));
      nextBtn.appendChild(makeSvgArrow('9 18 15 12 9 6'));

      counter = document.createElement('span');
      counter.className = 'event-modal__nav-counter';
      counter.setAttribute('aria-live', 'polite');

      shell.append(prevBtn, nextBtn, counter);
    }

    overlay.appendChild(shell);
    document.body.appendChild(overlay);
    document.body.classList.add('has-event-modal');

    function updateContent(index) {
      currentIndex = index;
      contentArea.replaceChildren(buildModalContent(candidates.at(index)));
      if (candidates.length > 1) {
        counter.textContent = (index + 1) + ' / ' + candidates.length;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === candidates.length - 1;
      }
    }

    updateContent(0);
    closeBtn.focus();

    function cleanup() {
      overlay.remove();
      document.body.classList.remove('has-event-modal');
      document.removeEventListener('keydown', onKeydown);
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    }

    function close() {
      if (modal.classList.contains('is-closing')) return;
      modal.classList.add('is-closing');
      overlay.classList.add('is-closing');
      markDismissed(candidates.at(currentIndex));
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
        trapFocus(shell, e);
      } else if (e.key === 'ArrowLeft' && prevBtn && !prevBtn.disabled) {
        updateContent(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && nextBtn && !nextBtn.disabled) {
        updateContent(currentIndex + 1);
      }
    }

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay || e.target === shell) close(); });
    if (prevBtn) prevBtn.addEventListener('click', () => updateContent(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => updateContent(currentIndex + 1));
    document.addEventListener('keydown', onKeydown);
  }

  // ── Initialisation par page ──────────────────────────────────
  let cachedEvents = null;

  function render() {
    if (!cachedEvents) return;
    const upcomingEl = document.querySelector('[data-evenements="upcoming"]');
    const pastEl = document.querySelector('[data-evenements="past"]');
    const popupMount = document.querySelector('[data-evenements="popup"]');

    if (!upcomingEl && !pastEl && !popupMount) return;

    const { upcoming, past } = splitEvents(cachedEvents, new Date());
    if (upcomingEl) renderList(upcomingEl, upcoming, t('event.empty.upcoming', "Pas d'évènement prévu pour l'instant."));
    if (pastEl) renderList(pastEl, past, t('event.empty.past', "Pas d'évènement passé à afficher."));
    if (popupMount && !popupMount.dataset.shown) {
      const candidates = pickPopupCandidates(upcoming, new Date());
      if (candidates.length) {
        popupMount.dataset.shown = '1';
        showEventPopup(candidates);
      }
    }
  }

  function init() {
    const upcomingEl = document.querySelector('[data-evenements="upcoming"]');
    const pastEl = document.querySelector('[data-evenements="past"]');
    const popupMount = document.querySelector('[data-evenements="popup"]');

    if (!upcomingEl && !pastEl && !popupMount) return;

    loadEvents().then(events => {
      cachedEvents = events;
      render();
    });

    document.addEventListener('i18n:changed', () => {
      const popupMount = document.querySelector('[data-evenements="popup"]');
      if (popupMount) delete popupMount.dataset.shown;
      const existing = document.querySelector('.event-modal-overlay');
      if (existing) existing.remove();
      document.body.classList.remove('has-event-modal');
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
