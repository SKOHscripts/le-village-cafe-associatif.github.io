#!/usr/bin/env node
/* =============================================
   LE VILLAGE — fetch-helloasso-stats.mjs

   Interroge l'API HelloAsso pour compter les adhésions souscrites en ligne
   et écrit le résultat dans data/adhesions-stats.json, que adhesion.html lit
   côté navigateur.

   L'API HelloAsso exige un couple client_id / client_secret (OAuth2
   client_credentials) qui ne peut pas être exposé dans une page statique :
   ce script est donc exécuté par GitHub Actions, où les identifiants sont
   stockés en secrets de dépôt.

   Variables d'environnement :
     HELLOASSO_CLIENT_ID           (requis)  identifiant d'API HelloAsso
     HELLOASSO_CLIENT_SECRET       (requis)  secret d'API HelloAsso
     HELLOASSO_ORGANIZATION_SLUG   (option)  slug de l'association
     HELLOASSO_FORM_SLUG           (option)  slug de la campagne d'adhésion
     HELLOASSO_FORM_TYPE           (option)  type de formulaire (Membership)
     HELLOASSO_API_BASE            (option)  base de l'API
   ============================================= */

/* jshint esversion: 11, node: true */

import { writeFile } from 'node:fs/promises';

const CLIENT_ID     = process.env.HELLOASSO_CLIENT_ID;
const CLIENT_SECRET = process.env.HELLOASSO_CLIENT_SECRET;
const ORG_SLUG      = process.env.HELLOASSO_ORGANIZATION_SLUG || 'cafe-associatif-le-village';
const FORM_SLUG     = process.env.HELLOASSO_FORM_SLUG         || 'adhesion-au-village-cafe-associatif-2026';
const FORM_TYPE     = process.env.HELLOASSO_FORM_TYPE         || 'Membership';
const API_BASE      = process.env.HELLOASSO_API_BASE          || 'https://api.helloasso.com';
const OUT_FILE      = 'data/adhesions-stats.json';

// Une adhésion n'est comptabilisée que si elle est effectivement valide :
// les paiements annulés, remboursés ou en attente sont ignorés.
const VALID_STATES = new Set(['processed', 'registered']);
const TIMEZONE     = 'Europe/Paris';
const PAGE_SIZE    = 100;
const MAX_PAGES    = 200; // garde-fou contre une pagination qui ne se termine pas

function fail(message) {
  console.error('✖ ' + message);
  process.exit(1);
}

async function getAccessToken() {
  const res = await fetch(API_BASE + '/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    fail(`Authentification HelloAsso refusée (HTTP ${res.status}) : ${await res.text()}`);
  }
  const json = await res.json();
  if (!json.access_token) fail("Réponse d'authentification HelloAsso sans access_token.");
  return json.access_token;
}

// Récupère tous les « items » du formulaire d'adhésion. Un item = une adhésion
// (une commande peut en contenir plusieurs, par exemple pour une famille).
async function fetchItems(token) {
  const items = [];
  let pageIndex = 1;
  let totalPages = 1;

  while (pageIndex <= totalPages && pageIndex <= MAX_PAGES) {
    const url = new URL(
      `${API_BASE}/v5/organizations/${ORG_SLUG}/forms/${FORM_TYPE}/${FORM_SLUG}/items`
    );
    url.searchParams.set('pageSize', String(PAGE_SIZE));
    url.searchParams.set('pageIndex', String(pageIndex));
    url.searchParams.set('withDetails', 'false');

    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) {
      fail(`Lecture des adhésions impossible (HTTP ${res.status}) : ${await res.text()}`);
    }
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    items.push(...data);

    const pagination = json.pagination || {};
    totalPages = Number(pagination.totalPages) || 1;
    if (!data.length) break;
    pageIndex += 1;
  }

  return items;
}

// Renvoie la date d'une adhésion : celle de la commande, sinon celle du
// premier paiement rattaché.
function itemDate(item) {
  const raw = (item.order && item.order.date) ||
              (Array.isArray(item.payments) && item.payments.length ? item.payments[0].date : null);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Année et mois calendaires à l'heure de Paris (et non UTC), pour que le
// décompte corresponde à ce que voit l'association.
const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE, year: 'numeric', month: '2-digit',
});
function yearMonth(date) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map(p => [p.type, p.value])
  );
  return { year: parts.year, month: parts.year + '-' + parts.month };
}

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    fail('HELLOASSO_CLIENT_ID et HELLOASSO_CLIENT_SECRET doivent être définis.');
  }

  const token = await getAccessToken();
  const items = await fetchItems(token);

  const now     = new Date();
  const nowKeys = yearMonth(now);

  let total = 0, totalAnnee = 0, totalMois = 0;
  for (const item of items) {
    const state = String(item.state || '').toLowerCase();
    if (!VALID_STATES.has(state)) continue;
    total += 1;

    const date = itemDate(item);
    if (!date) continue;
    const keys = yearMonth(date);
    if (keys.year  === nowKeys.year)  totalAnnee += 1;
    if (keys.month === nowKeys.month) totalMois  += 1;
  }

  const stats = {
    generated_at: now.toISOString(),
    source: 'helloasso',
    organization: ORG_SLUG,
    form: FORM_SLUG,
    total_mois: totalMois,
    total_annee: totalAnnee,
    total: total,
  };

  await writeFile(OUT_FILE, JSON.stringify(stats, null, 2) + '\n', 'utf8');
  console.log(`✔ ${OUT_FILE} mis à jour — ${totalMois} ce mois-ci, ${totalAnnee} cette année, ${total} au total.`);
}

main().catch(err => fail(err && err.stack ? err.stack : String(err)));
