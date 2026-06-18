-- =============================================================
-- LE VILLAGE — Table `evenements` (Supabase / Postgres)
-- À exécuter UNE FOIS dans Supabase → SQL Editor → New query.
-- Ensuite, toute la gestion se fait dans Table Editor (aucun code) :
--   • Ajouter   : « Insert row »
--   • Masquer   : décocher la case `visible`
--   • Supprimer : supprimer la ligne
-- Voir data/EVENEMENTS.md pour le guide bénévoles.
-- =============================================================

-- 1) Table -----------------------------------------------------
create table if not exists public.evenements (
  id                uuid primary key default gen_random_uuid(),
  titre             text not null,
  titre_en          text,
  date              date not null,
  heure_debut       time,
  heure_fin         time,
  lieu              text,
  lieu_en           text,
  description       text,
  description_en    text,
  notice            text,
  notice_en         text,
  confirmation_mail text,
  photo             text,          -- nom du fichier déposé dans assets/images/ (ex. guinguette-2026.jpg)
  photo_alt         text,
  lien_facebook     text,
  lien_instagram    text,
  visible           boolean not null default true,
  created_at        timestamptz not null default now()
);

create index if not exists evenements_date_idx on public.evenements (date);

-- 2) Row Level Security ---------------------------------------
-- Lecture publique des évènements visibles uniquement ; aucune
-- écriture possible avec la clé anon (gestion via le dashboard).
alter table public.evenements enable row level security;

drop policy if exists "Public read visible events" on public.evenements;
create policy "Public read visible events"
  on public.evenements
  for select
  to anon, authenticated
  using (visible = true);

-- 3) Données initiales (reprise de data/evenements.json) -------
insert into public.evenements
  (titre, titre_en, date, heure_debut, heure_fin, lieu, lieu_en,
   description, description_en, notice, notice_en, confirmation_mail,
   photo, photo_alt, visible)
values
  ('Afterwork du Village', 'Village afterwork', '2026-05-22', '16:00', '21:00',
   'Le Village, 8 rue Chalumeaux, Lyon 8e', 'Le Village, 8 rue Chalumeaux, Lyon 8th district',
   'Fin de semaine en douceur : venez boire un verre, jouer, discuter avec les voisins. Entrée libre, adhésion au tarif solidaire.',
   'Ease into the weekend: come for a drink, play games, chat with neighbours. Free entry, solidarity membership rate.',
   null, null, null, null, null, true),

  ('Afterwork du Village', 'Village afterwork', '2026-05-29', '16:00', '21:00',
   'Le Village, 8 rue Chalumeaux, Lyon 8e', 'Le Village, 8 rue Chalumeaux, Lyon 8th district',
   'Fin de semaine en douceur : venez boire un verre, jouer, discuter avec les voisins. Entrée libre, adhésion au tarif solidaire.',
   'Ease into the weekend: come for a drink, play games, chat with neighbours. Free entry, solidarity membership rate.',
   null, null, null, null, null, true),

  ('Goûter des familles', 'Family tea time', '2026-06-06', '16:00', '19:00',
   'Le Village, 8 rue Chalumeaux, Lyon 8e', 'Le Village, 8 rue Chalumeaux, Lyon 8th district',
   'Un temps convivial entre les familles du quartier autour d''un goûter partagé.',
   'A friendly gathering for families of the neighbourhood over a shared tea time.',
   null, null, null, null, null, true),

  ('La Guinguette du village', 'Village Guinguette', '2026-06-20', '17:00', '22:00',
   'Le Village, 8 rue Chalumeaux, Lyon 8e', 'Le Village, 8 rue Chalumeaux, Lyon 8th district',
   E'Une journée en plein air au son de la musique pour guincher, chanter, s''amuser ! avec le groupe "La sonora del martes"\nPetite restauration sur place',
   E'An outdoor day of music, dance and fun! with the band "La sonora del martes"\nLight catering on site',
   '⚠️ Le café sera exceptionnellement fermé le vendredi 19 et le dimanche 21 juin autour de cet évènement.',
   '⚠️ The café will be exceptionally closed on Friday 19 and Sunday 21 June around this event.',
   'contact@cafe-levillage.org', 'guinguette-2026.jpg', 'Le groupe La sonora del martes en concert', true),

  -- Évènement de TEST : réouverture du café le mardi suivant la Guinguette.
  ('Réouverture du café', 'The café reopens', '2026-06-23', '16:00', '19:00',
   'Le Village, 8 rue Chalumeaux, Lyon 8e', 'Le Village, 8 rue Chalumeaux, Lyon 8th district',
   'Après la Guinguette de samedi, le café rouvre ses portes ce mardi ! Venez décompresser autour d''un verre et nous raconter votre week-end. (Évènement de test)',
   'After Saturday''s Guinguette, the café reopens this Tuesday! Come unwind over a drink and tell us about your weekend. (Test event)',
   null, null, null, null, null, true),

  ('Goûter des familles', 'Family tea time', '2026-07-04', '16:00', '19:00',
   'Le Village, 8 rue Chalumeaux, Lyon 8e', 'Le Village, 8 rue Chalumeaux, Lyon 8th district',
   'Un temps convivial entre les familles du quartier autour d''un goûter partagé.',
   'A friendly gathering for families of the neighbourhood over a shared tea time.',
   null, null, null, null, null, true),

  ('Goûter des familles', 'Family tea time', '2026-08-01', '16:00', '19:00',
   'Le Village, 8 rue Chalumeaux, Lyon 8e', 'Le Village, 8 rue Chalumeaux, Lyon 8th district',
   'Un temps convivial entre les familles du quartier autour d''un goûter partagé.',
   'A friendly gathering for families of the neighbourhood over a shared tea time.',
   null, null, null, null, null, true),

  ('Café des familles', 'Family café', '2026-05-16', '16:00', '19:00',
   'Le Village, 8 rue Chalumeaux, Lyon 8e', 'Le Village, 8 rue Chalumeaux, Lyon 8th district',
   'Premier créneau d''une série d''évènements pour créer un temps convivial entre les familles du quartier. Ambiance goûter de 16h à 19h, autour d''un partage d''idées.',
   'First in a series of events bringing families of the neighbourhood together for a friendly afternoon. Tea-time from 4pm to 7pm, sharing ideas.',
   null, null, null, null, null, true),

  ('Soirée Jeux de société', 'Board games night', '2026-03-27', null, null,
   null, null,
   'Une soirée conviviale autour des jeux de société, de 18h à 20h30.',
   'A friendly evening around board games, from 6pm to 8:30pm.',
   null, null, null, null, null, true),

  ('Les Ateliers du Village', 'Village workshops', '2026-03-21', null, null,
   null, null,
   'Plantations, remise en état des bancs, ponçage et pique-nique partagé à midi.',
   'Planting, repairing benches, sanding and a shared picnic at lunchtime.',
   null, null, null, null, null, true),

  ('La St Patrick au Village', 'St Patrick''s at Le Village', '2026-03-17', null, null,
   null, null,
   'Une soirée festive avec musique et jeux, réservée à nos adhérents.',
   'A festive evening with music and games, members only.',
   null, null, null, null, null, true);
