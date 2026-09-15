/* tsqllint-disable */
-- Ce script est du PostgreSQL. Codacy analyse les .sql avec tsqllint, qui
-- attend du T-SQL et réclame des directives SQL Server invalides ici.

-- Le Village — notifications (cloche de la barre haute)
--
-- Les notifications vivent dans la table `evenements` plutôt que dans une
-- table à part : un évènement EST une information à signaler, autant ne pas
-- la saisir deux fois. La table accueille donc deux sortes de lignes :
--
--   type = 'evenement' : ce qu'elle contenait déjà (agenda, accueil, cloche)
--   type = 'info'      : changement d'horaire, nouveauté du site… (cloche seule)
--
-- À coller dans Supabase → SQL Editor → Run. Le script est idempotent :
-- on peut le relancer sans risque.

-- ── Nouvelles colonnes ──────────────────────────────────────────────────────
alter table public.evenements
  add column if not exists type        text        not null default 'evenement',
  add column if not exists resume      text,
  add column if not exists resume_en   text,
  add column if not exists icone       text,
  add column if not exists notif_jours integer,
  add column if not exists notif_debut timestamptz not null default now();

comment on column public.evenements.type is
  'evenement = agenda + accueil + cloche ; info = cloche seule (horaires, site…).';
comment on column public.evenements.resume is
  'Une phrase affichée sous le titre dans la cloche. Vide = début de la description.';
comment on column public.evenements.resume_en is
  'Traduction anglaise du résumé.';
comment on column public.evenements.icone is
  'Icône dans la cloche : info, horaire, site, evenement ou alerte. Vide = calendrier pour un évènement, info sinon.';
comment on column public.evenements.notif_jours is
  'Nombre de jours pendant lesquels la ligne reste dans la cloche, à partir de notif_debut. Vide = jusqu''au lendemain de la date pour un évènement, 30 jours pour une info.';
comment on column public.evenements.notif_debut is
  'Date de parution dans la cloche. Une date future retarde l''apparition.';

-- Une info n'a pas de date d'évènement ; un évènement en garde une.
alter table public.evenements
  alter column date drop not null;

alter table public.evenements
  drop constraint if exists evenements_type_connu;
alter table public.evenements
  add constraint evenements_type_connu
  check (type in ('evenement', 'info'));

alter table public.evenements
  drop constraint if exists evenements_evenement_date_requise;
alter table public.evenements
  add constraint evenements_evenement_date_requise
  check (type <> 'evenement' or date is not null);

-- Le site ne sait dessiner que ce jeu d'icônes.
alter table public.evenements
  drop constraint if exists evenements_icone_connue;
alter table public.evenements
  add constraint evenements_icone_connue
  check (icone is null or icone in ('info', 'horaire', 'site', 'evenement', 'alerte'));

alter table public.evenements
  drop constraint if exists evenements_notif_jours_raisonnable;
alter table public.evenements
  add constraint evenements_notif_jours_raisonnable
  check (notif_jours is null or (notif_jours >= 1 and notif_jours <= 365));

create index if not exists evenements_notif_debut_idx
  on public.evenements (notif_debut desc);

-- ── Vue lue par la cloche ───────────────────────────────────────────────────
-- La fenêtre d'affichage vit ici et non dans une policy : la policy porte sur
-- la table, or l'agenda a besoin de servir les évènements passés. La vue donne
-- le même service — la règle reste vraie même si un appel oublie de filtrer —
-- sans amputer l'agenda.
--
-- Fin de la notification :
--   notif_jours renseigné  → notif_debut + ce nombre de jours
--   sinon, évènement daté  → le lendemain de l'évènement (minuit, heure de Paris)
--   sinon (info)           → 30 jours après la parution
create or replace view public.notifications_actives as
with fenetre as (
  select
    e.*,
    case
      when e.notif_jours is not null
        then e.notif_debut + make_interval(days => e.notif_jours)
      when e.type = 'evenement' and e.date is not null
        then (e.date + 1)::timestamp at time zone 'Europe/Paris'
      else e.notif_debut + interval '30 days'
    end as notif_fin
  from public.evenements e
)
select
  id, type, titre, titre_en, resume, resume_en, description, description_en,
  icone, date, heure_debut, heure_fin, lieu, lieu_en, notice, notice_en,
  confirmation_mail, lien_inscription, lien_inscription_label,
  lien_inscription_label_en, photo, photo_alt, lien_facebook, lien_instagram,
  notif_debut, notif_fin
from fenetre
where visible
  and notif_debut <= now()
  and notif_fin > now();

comment on view public.notifications_actives is
  'Lignes de `evenements` actuellement affichables dans la cloche du site.';

-- La vue s'exécute avec les droits de son lecteur : les policies RLS de
-- `evenements` continuent donc de s'appliquer. (PostgreSQL 15 ou plus ;
-- sur une version antérieure, retirer cette ligne.)
alter view public.notifications_actives set (security_invoker = on);

grant select on public.notifications_actives to anon, authenticated;

-- ── Première notification ───────────────────────────────────────────────────
-- Retour à la fermeture de 21h le vendredi, les heures d'été étant passées.
-- Visible 90 jours, le temps que les habitués prennent le pli. Pas de `date` :
-- c'est une info, elle n'ira donc pas dans l'agenda.
--
-- Le `where not exists` rend l'insertion rejouable : relancer le script ne
-- crée pas de doublon.
insert into public.evenements
  (type, titre, titre_en, resume, resume_en, description, description_en, icone, notif_jours, visible)
select
  'info',
  'Le vendredi, retour à 21h',
  'Fridays back to 9pm',
  'Les heures d''été sont finies : le café referme à 21h le vendredi.',
  'Summer hours are over: the café closes at 9pm on Fridays again.',
  'Le Village retrouve son horaire classique du vendredi : 16h – 21h.

Les heures d''été, qui nous faisaient fermer à 22h, sont derrière nous jusqu''à l''an prochain. Les mardis (14h30 – 19h) et les dimanches (10h – 13h) ne changent pas.',
  'Le Village is back to its usual Friday hours: 4pm – 9pm.

The summer hours that kept us open until 10pm are behind us until next year. Tuesdays (2:30pm – 7pm) and Sundays (10am – 1pm) are unchanged.',
  'horaire',
  90,
  true
where not exists (
  select 1 from public.evenements
  where type = 'info' and titre = 'Le vendredi, retour à 21h'
);

-- ── Exemple ─────────────────────────────────────────────────────────────────
-- Autre forme d'info, avec un bouton : `lien_inscription` sert de lien
-- « En savoir plus » et `notif_jours` la laisse un an dans la cloche.
--
-- insert into public.evenements (type, titre, resume, description, icone, lien_inscription, lien_inscription_label, notif_jours, visible)
-- values (
--   'info',
--   'La carte des boissons a changé',
--   'Nouveaux jus locaux et deux bières de plus à la pression.',
--   'On a revu la carte avec les producteurs du quartier. À découvrir sur place, ou en ligne.',
--   'site',
--   'https://cafe-levillage.org/carte.html',
--   'Voir la carte',
--   365,
--   true
-- );
