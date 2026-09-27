/* =============================================
   LE VILLAGE — stats.js
   Mesure d'audience anonyme → table Supabase `visites`
   (voir supabase/2026-09-27_visites.sql et data/STATISTIQUES.md).

   - une ligne par page affichée, avec sa provenance (QR code, Instagram…)
     sur la première page d'une visite ;
   - une ligne par clic sur un bouton « Adhérer » ou une billetterie.

   Aucune donnée personnelle, aucun cookie. Seul un repère de visite est
   gardé dans sessionStorage, effacé à la fermeture de l'onglet.
   L'envoi passe par l'API REST de Supabase, sans charger supabase-js.
   ============================================= */

/* jshint browser: true */
(function () {
  var metaUrl = document.querySelector('meta[name="supabase-url"]');
  var metaKey = document.querySelector('meta[name="supabase-anon-key"]');
  if (!metaUrl || !metaKey || !window.fetch) return;
  var ENDPOINT = metaUrl.getAttribute('content') + '/rest/v1/visites';
  var KEY = metaKey.getAttribute('content');

  // Pas de mesure en local, ni pour les robots et navigateurs automatisés.
  if (!/^https?:$/.test(location.protocol)) return;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  if (navigator.webdriver || /bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent)) return;

  // Sources connues : domaine d'origine → nom court.
  var SOURCES = [
    [/(^|\.)instagram\.com$/, 'instagram'],
    [/(^|\.)facebook\.com$|(^|\.)fb\.me$/, 'facebook'],
    [/(^|\.)google\.[a-z.]+$/, 'google'],
    [/(^|\.)bing\.com$/, 'bing'],
    [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
    [/(^|\.)qwant\.com$/, 'qwant'],
    [/(^|\.)ecosia\.org$/, 'ecosia'],
    [/(^|\.)helloasso\.com$/, 'helloasso']
  ];

  function clean(value) {
    var v = String(value || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 60);
    return v || null;
  }

  function page() {
    var p = location.pathname.replace(/\/index\.html$/, '/');
    return p.slice(0, 200) || '/';
  }

  function langue() {
    var l;
    try { l = localStorage.getItem('village-lang'); } catch (e) {}
    return l === 'en' ? 'en' : 'fr';
  }

  function send(row) {
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        keepalive: true, // l'envoi aboutit même si la page se ferme (clic sortant)
        headers: {
          apikey: KEY,
          Authorization: 'Bearer ' + KEY,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(row)
      }).catch(function () {});
    } catch (e) {}
  }

  // ── Première page de la visite ? (repère limité à l'onglet) ──
  var entree = true;
  try {
    entree = !sessionStorage.getItem('village-visite');
    sessionStorage.setItem('village-visite', '1');
  } catch (e) {}

  // ── Provenance : ?utm_source=… d'abord (QR code, lien en bio), sinon le site d'origine ──
  var source = null;
  var params = new URLSearchParams(location.search);
  if (params.has('utm_source')) {
    source = clean(params.get('utm_source'));
    // On retire les paramètres de suivi de la barre d'adresse : un lien
    // copié-partagé ne comptera pas une seconde fois comme « QR code ».
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { params.delete(k); });
    var qs = params.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) {}
  } else if (entree && document.referrer) {
    try {
      var host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (host && host !== location.hostname.replace(/^www\./, '')) {
        source = clean(host);
        for (var i = 0; i < SOURCES.length; i++) {
          if (SOURCES[i][0].test(host)) { source = SOURCES[i][1]; break; }
        }
      }
    } catch (e) {}
  }

  send({ type: 'page', page: page(), source: entree ? source : null, entree: entree, langue: langue() });

  // ── Clics suivis ──
  // adherer     : bouton .btn vers adhesion.html, ou page d'adhésion HelloAsso
  // inscription : billetterie HelloAsso d'un évènement
  function cible(a) {
    var href = a.getAttribute('href') || '';
    if (/helloasso\.com\/associations\/[^/]+\/evenements\//i.test(href)) return 'inscription';
    if (/helloasso\.com\/associations\/[^/]+\/adhesions\//i.test(href)) return 'adherer';
    if (a.classList.contains('btn') && /(^|\/)adhesion\.html(?:$|[?#])/.test(href)) return 'adherer';
    return null;
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var c = cible(a);
    if (c) send({ type: 'clic', page: page(), cible: c, langue: langue() });
  }, true);
})();
