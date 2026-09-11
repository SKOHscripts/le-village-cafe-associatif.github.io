/* =============================================
   LE VILLAGE — supabase-client.js
   Client Supabase partagé + chargement des évènements.

   L'URL et la clé anon sont lues depuis les balises <meta> de la page
   (supabase-url / supabase-anon-key). La clé anon est publique par
   conception : elle n'autorise que ce que les policies Row Level Security
   permettent (ici, lecture seule des évènements visibles).
   ============================================= */

/* jshint browser: true, devel: true */
(function () {
  'use strict';

  // Lues depuis les <meta> de la page ; null si absentes (fetchEvenements lancera une erreur).
  var metaUrl = document.querySelector('meta[name="supabase-url"]');
  var metaKey = document.querySelector('meta[name="supabase-anon-key"]');
  var SUPABASE_URL = metaUrl ? metaUrl.getAttribute('content') : null;
  var SUPABASE_KEY = metaKey ? metaKey.getAttribute('content') : null;

  let client = null;

  // Création paresseuse : window.supabase est fourni par le CDN @supabase/supabase-js.
  function getClient() {
    if (client) return client;
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      return client;
    }
    return null;
  }

  // Construit un chemin d'image utilisable depuis la valeur stockée en base.
  // La base ne contient que le nom du fichier (ex. "guinguette-2026.jpg"),
  // les fichiers vivant dans assets/images/. On accepte aussi une URL complète
  // ou un chemin déjà préfixé, par souplesse.
  function toImagePath(photo) {
    if (typeof photo !== 'string' || !photo.trim()) return null;
    const p = photo.trim();
    if (/^https?:\/\//i.test(p)) return p;
    if (/^assets\//i.test(p)) return p;
    return 'assets/images/' + p;
  }

  function hhmm(t) {
    return typeof t === 'string' && t ? t.slice(0, 5) : undefined;
  }

  // Convertit une ligne de la table `evenements` (colonnes snake_case) vers
  // la forme attendue par les moteurs de rendu (identique à data/evenements.json).
  function normalize(row) {
    const photoPath = toImagePath(row.photo);
    const liens = (row.lien_facebook || row.lien_instagram)
      ? { facebook: row.lien_facebook || undefined, instagram: row.lien_instagram || undefined }
      : undefined;
    return {
      id: row.id,
      titre: row.titre,
      titre_en: row.titre_en,
      date: row.date,
      heureDebut: hhmm(row.heure_debut),
      heureFin: hhmm(row.heure_fin),
      lieu: row.lieu,
      lieu_en: row.lieu_en,
      description: row.description,
      description_en: row.description_en,
      notice: row.notice,
      notice_en: row.notice_en,
      confirmationMail: row.confirmation_mail,
      lienInscription: row.lien_inscription,
      lienInscriptionLabel: row.lien_inscription_label,
      lienInscriptionLabel_en: row.lien_inscription_label_en,
      photos: photoPath ? [photoPath] : [],
      photo_alt: row.photo_alt,
      liens: liens,
    };
  }

  // Charge les évènements depuis Supabase. Lance une erreur en cas d'échec ;
  // c'est aux appelants d'afficher un message adapté à l'utilisateur.
  async function fetchEvenements() {
    const sb = getClient();
    if (!sb) throw new Error('client Supabase indisponible');
    const { data, error } = await sb
      .from('evenements')
      .select('*')
      .eq('visible', true)
      .order('date', { ascending: true });
    if (error) throw error;
    return (data || []).map(normalize);
  }

  window.VillageSupabase = {
    getClient: getClient,
    fetchEvenements: fetchEvenements,
  };
})();
