/* tsqllint-disable */
-- Ce script est du PostgreSQL. Codacy analyse les .sql avec tsqllint, qui
-- attend du T-SQL et réclame des directives SQL Server invalides ici.

-- Le Village — statistiques de visite (table `visites`)
--
-- Mesure d'audience anonyme, alimentée par assets/js/stats.js. Une ligne par
-- page affichée (type = 'page') ou par clic suivi (type = 'clic'). Aucune
-- donnée personnelle : ni adresse IP, ni navigateur, ni cookie, ni
-- identifiant de visiteur.
--
-- Le site peut seulement AJOUTER des lignes (clé anon) ; il ne peut ni les
-- lire, ni les modifier. Les chiffres se consultent dans Supabase, via les
-- vues `stats_*` en fin de script (Table Editor ou SQL Editor).
--
-- À coller dans Supabase → SQL Editor → Run. Le script est idempotent :
-- on peut le relancer sans risque.

-- ── Table ───────────────────────────────────────────────────────────────────
create table if not exists public.visites (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type       text        not null default 'page',
  page       text        not null,
  source     text,
  entree     boolean     not null default false,
  cible      text,
  langue     text
);

comment on table public.visites is
  'Mesure d''audience anonyme du site (pages vues et clics suivis). Alimentée par assets/js/stats.js.';
comment on column public.visites.type is
  'page = une page affichée ; clic = un clic sur un bouton suivi (voir cible).';
comment on column public.visites.page is
  'Chemin de la page, ex. /agenda.html (/ pour l''accueil).';
comment on column public.visites.source is
  'Provenance, renseignée sur la première page d''une visite : qr, instagram, facebook, google… ou le domaine du site d''origine. Vide = accès direct.';
comment on column public.visites.entree is
  'Vrai pour la première page d''une visite (onglet). Compter ces lignes = compter les visites.';
comment on column public.visites.cible is
  'Pour un clic : adherer (bouton Adhérer, page HelloAsso d''adhésion) ou inscription (billetterie d''un évènement).';
comment on column public.visites.langue is
  'Langue d''affichage du site : fr ou en.';

-- ── Garde-fous : le site écrit avec une clé publique, on borne les valeurs ──
alter table public.visites drop constraint if exists visites_type_connu;
alter table public.visites add constraint visites_type_connu
  check (type in ('page', 'clic'));

alter table public.visites drop constraint if exists visites_page_valide;
alter table public.visites add constraint visites_page_valide
  check (page ~ '^/' and char_length(page) <= 200);

alter table public.visites drop constraint if exists visites_source_valide;
alter table public.visites add constraint visites_source_valide
  check (source is null or source ~ '^[a-z0-9._-]{1,60}$');

alter table public.visites drop constraint if exists visites_cible_connue;
alter table public.visites add constraint visites_cible_connue
  check ((type = 'page' and cible is null)
      or (type = 'clic' and cible in ('adherer', 'inscription')));

alter table public.visites drop constraint if exists visites_langue_connue;
alter table public.visites add constraint visites_langue_connue
  check (langue is null or langue in ('fr', 'en'));

create index if not exists visites_created_at_idx on public.visites (created_at);

-- ── Droits : ajout seul, et seulement sur ces colonnes ──────────────────────
-- created_at et id restent aux mains de la base (impossible d'antidater).
alter table public.visites enable row level security;

revoke all on public.visites from anon, authenticated;
grant insert (type, page, source, entree, cible, langue)
  on public.visites to anon, authenticated;

drop policy if exists "visites_ajout_public" on public.visites;
create policy "visites_ajout_public" on public.visites
  for insert to anon, authenticated
  with check (true);
-- Pas de policy SELECT / UPDATE / DELETE : le site ne peut rien relire.

-- ── Vues de consultation (Supabase → Table Editor, rubrique Views) ──────────
-- security_invoker : les vues appliquent les droits de celui qui les lit,
-- donc la clé publique du site ne peut pas les lire non plus.

-- Par jour : visites (premières pages), pages vues et clics.
create or replace view public.stats_par_jour
with (security_invoker = true) as
select (created_at at time zone 'Europe/Paris')::date                    as jour,
       count(*) filter (where type = 'page' and entree)                  as visites,
       count(*) filter (where type = 'page')                             as pages_vues,
       count(*) filter (where type = 'clic' and cible = 'adherer')       as clics_adherer,
       count(*) filter (where type = 'clic' and cible = 'inscription')   as clics_inscription
from   public.visites
group  by 1
order  by 1 desc;

-- Pages les plus vues sur les 30 derniers jours.
create or replace view public.stats_pages_30j
with (security_invoker = true) as
select page,
       count(*)                            as pages_vues,
       count(*) filter (where entree)       as visites_arrivees_ici
from   public.visites
where  type = 'page'
  and  created_at >= now() - interval '30 days'
group  by page
order  by pages_vues desc;

-- D'où viennent les visites, par mois (QR code, Instagram, Facebook…).
create or replace view public.stats_sources_par_mois
with (security_invoker = true) as
select to_char(created_at at time zone 'Europe/Paris', 'YYYY-MM') as mois,
       coalesce(source, 'direct')                                  as source,
       count(*)                                                    as visites
from   public.visites
where  type = 'page' and entree
group  by 1, 2
order  by 1 desc, 3 desc;

-- Clics suivis par mois et par page d'origine.
create or replace view public.stats_clics_par_mois
with (security_invoker = true) as
select to_char(created_at at time zone 'Europe/Paris', 'YYYY-MM') as mois,
       cible,
       page,
       count(*)                                                    as clics
from   public.visites
where  type = 'clic'
group  by 1, 2, 3
order  by 1 desc, 4 desc;

revoke all on public.stats_par_jour,
              public.stats_pages_30j,
              public.stats_sources_par_mois,
              public.stats_clics_par_mois
  from anon, authenticated;
