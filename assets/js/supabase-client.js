/* =============================================
   LE VILLAGE — supabase-client.js
   Client Supabase partagé + chargement des évènements.

   Source unique de l'URL + clé "anon" (publique par design Supabase,
   protégée par les policies Row Level Security côté serveur).

   Expose window.VillageSupabase :
     - .client()           → client supabase-js (singleton, lazy)
     - .fetchEvenements()  → liste d'évènements visibles, normalisée au
                             format attendu par les moteurs de rendu, avec
                             repli automatique sur data/evenements.json.
   ============================================= */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://evifxtecjhemmaxaiozt.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2aWZ4dGVjamhlbW1heGFpb3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NzIzNzIsImV4cCI6MjA5MjU0ODM3Mn0.0Z4AL42b8cR0iKOZtfdiRQTcMbqZZi36RvYYEcFA48U';
  const FALLBACK_JSON = 'data/evenements.json';

  let _client = null;

  function client() {
    if (_client) return _client;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return _client;
  }

  // Une heure "HH:MM:SS" (Postgres time) → "HH:MM" ; null/'' → undefined.
  function hhmm(value) {
    if (!value) return undefined;
    return String(value).slice(0, 5);
  }

  // Le champ `photo` stocke un nom de fichier déposé dans assets/images/.
  // On accepte aussi une URL complète ou un chemin assets/ déjà formé.
  function toImagePath(photo) {
    if (!photo) return null;
    const p = String(photo).trim();
    if (!p) return null;
    if (/^https?:\/\//i.test(p) || /^assets\//i.test(p)) return p;
    return 'assets/images/' + p;
  }

  // Ligne Supabase (colonnes snake_case) → objet au format historique du
  // JSON, pour que evenements.js et les cartes inline restent inchangés.
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

  async function fetchFromJson() {
    const res = await fetch(FALLBACK_JSON);
    if (!res.ok) return [];
    return res.json();
  }

  // Charge les évènements visibles depuis Supabase. En cas d'erreur
  // (lib absente, réseau, table inexistante…), repli sur le JSON local.
  // Un résultat vide mais valide est respecté (pas de repli) une fois la
  // table en place — c'est le cas "aucun évènement publié".
  async function fetchEvenements() {
    const sb = client();
    if (!sb) {
      console.warn('[evenements] supabase-js indisponible, repli JSON.');
      return fetchFromJson();
    }
    try {
      const { data, error } = await sb
        .from('evenements')
        .select('*')
        .eq('visible', true)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data || []).map(normalize);
    } catch (err) {
      console.warn('[evenements] Supabase indisponible, repli JSON :', err);
      return fetchFromJson();
    }
  }

  window.VillageSupabase = {
    URL: SUPABASE_URL,
    KEY: SUPABASE_KEY,
    client: client,
    fetchEvenements: fetchEvenements,
  };
})();
