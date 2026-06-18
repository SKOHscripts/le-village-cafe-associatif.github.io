/* =============================================
   LE VILLAGE — supabase-client.js
   Client Supabase partagé + chargement des évènements.

   Source unique de l'URL et de la clé publique (anon) du projet.
   La clé "anon" est publique par conception : elle n'autorise que ce que
   les policies Row Level Security permettent (ici, lecture seule des
   évènements visibles).
   ============================================= */

/* jshint browser: true, devel: true */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://evifxtecjhemmaxaiozt.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2aWZ4dGVjamhlbW1heGFpb3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzIzNzIsImV4cCI6MjA5MjU0ODM3Mn0.0Z4AL42b8cR0iKOZtfdiRQTcMbqZZi36RvYYEcFA48U';

  let client = null;

  // Création paresseuse : window.supabase est fourni par le CDN @supabase/supabase-js.
  function getClient() {
    if (client) return client;
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
