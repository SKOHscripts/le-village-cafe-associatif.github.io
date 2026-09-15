/* tsqllint-disable */
-- Ce script est du PostgreSQL. Codacy analyse les .sql avec tsqllint, qui
-- attend du T-SQL et réclame des directives SQL Server invalides ici.

-- Le Village — table `notifications`
-- Alimente la cloche de la barre haute du site : informations qui ne sont pas
-- des évènements (mise à jour du site, changement d'horaire, message du CA…).
--
-- À coller dans Supabase → SQL Editor → Run. Le script est idempotent :
-- on peut le relancer sans risque.

create table if not exists public.notifications (
  id               uuid        primary key default gen_random_uuid(),
  titre            text        not null,
  titre_en         text,
  resume           text        not null,
  resume_en        text,
  texte            text        not null,
  texte_en         text,
  icone            text        not null default 'info',
  lien             text,
  lien_label       text,
  lien_label_en    text,
  epingle          boolean     not null default false,
  visible          boolean     not null default true,
  date_publication timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

comment on table public.notifications is
  'Notifications affichées sous la cloche de la barre haute. Visibles 3 mois.';
comment on column public.notifications.titre is
  'Titre court affiché dans la liste et en tête de la pop-up.';
comment on column public.notifications.resume is
  'Une phrase de résumé, affichée sous le titre dans la liste et la pop-up.';
comment on column public.notifications.texte is
  'Texte complet, affiché dans la pop-up. Les retours à la ligne sont conservés.';
comment on column public.notifications.icone is
  'Icône de la notification : info, horaire, site, evenement ou alerte.';
comment on column public.notifications.lien is
  'URL https facultative ; affiche un bouton en bas de la pop-up.';
comment on column public.notifications.lien_label is
  'Texte du bouton en français. Vide = « En savoir plus ».';
comment on column public.notifications.lien_label_en is
  'Texte du bouton en anglais. Vide = « Learn more ».';
comment on column public.notifications.epingle is
  'Coché = la notification reste en tête de liste, avant les plus récentes.';
comment on column public.notifications.visible is
  'Décoché = la notification disparaît du site sans être supprimée.';
comment on column public.notifications.date_publication is
  'Date de parution. Une date future masque la notification jusqu''à son heure.';

-- Le site ne sait dessiner que ce jeu d'icônes ; une valeur hors liste
-- afficherait l'icône « info » par défaut, autant l'interdire en base.
alter table public.notifications
  drop constraint if exists notifications_icone_connue;
alter table public.notifications
  add constraint notifications_icone_connue
  check (icone in ('info', 'horaire', 'site', 'evenement', 'alerte'));

-- Le site n'affiche le bouton que pour une URL en https.
alter table public.notifications
  drop constraint if exists notifications_lien_https;
alter table public.notifications
  add constraint notifications_lien_https
  check (lien is null or lien ~ '^https://');

create index if not exists notifications_date_publication_idx
  on public.notifications (date_publication desc);

-- ── Lecture publique, limitée à 3 mois ──────────────────────────────────────
-- La rétention est portée par la policy et non par le code du site : passé
-- 3 mois, la notification ne sort plus de la base, même si un appel oublie
-- de filtrer.
alter table public.notifications enable row level security;

drop policy if exists "Notifications publiques (3 mois)" on public.notifications;
create policy "Notifications publiques (3 mois)"
  on public.notifications
  for select
  to anon, authenticated
  using (
    visible
    and date_publication <= now()
    and date_publication > now() - interval '3 months'
  );

grant select on public.notifications to anon, authenticated;

-- ── Exemple ─────────────────────────────────────────────────────────────────
-- Décommenter pour publier une première notification de test.
--
-- insert into public.notifications (titre, titre_en, resume, resume_en, texte, texte_en, icone)
-- values (
--   'Nouvel horaire le vendredi',
--   'New Friday hours',
--   'Le Village ferme désormais à 22h les vendredis d''été.',
--   'Le Village now closes at 10pm on summer Fridays.',
--   'À partir de ce mois-ci, le café reste ouvert jusqu''à 22h le vendredi pendant les heures d''été. Les mardis et dimanches ne changent pas.',
--   'From this month, the café stays open until 10pm on Fridays during summer hours. Tuesdays and Sundays are unchanged.',
--   'horaire'
-- );
