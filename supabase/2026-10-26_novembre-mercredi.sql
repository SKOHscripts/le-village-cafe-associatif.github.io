/* tsqllint-disable */
-- Ce script est du PostgreSQL. Codacy analyse les .sql avec tsqllint, qui
-- attend du T-SQL et réclame des directives SQL Server invalides ici.

-- Le Village — novembre 2026
--
-- 1. Le café n'ouvre plus le mardi mais le mercredi, aux mêmes horaires
--    (14h30 – 19h) : notification dans la cloche pendant 90 jours, et
--    correction de la notification « Le vendredi, retour à 21h », qui
--    citait encore le mardi.
-- 2. Les quatre évènements du programme de novembre.
--
-- À coller dans Supabase → SQL Editor → Run. Le script est idempotent :
-- les `where not exists` évitent les doublons, l'`update` réécrit le même
-- texte.

-- ── Le mardi devient le mercredi ────────────────────────────────────────────
insert into public.evenements
  (type, titre, titre_en, resume, resume_en, description, description_en, icone, notif_jours, visible)
select
  'info',
  'Le café ouvre le mercredi, plus le mardi',
  'Now open on Wednesdays, not Tuesdays',
  'L''après-midi du mardi passe au mercredi, toujours de 14h30 à 19h.',
  'The Tuesday afternoon moves to Wednesday, still 2:30pm – 7pm.',
  'Le Village n''ouvre plus le mardi : il vous accueille désormais le mercredi, aux mêmes horaires, de 14h30 à 19h. Ateliers, goûter, apéritif et jeux de société suivent le mouvement.

Nos horaires :
– mercredi : 14h30 – 19h
– vendredi : 16h – 21h
– dimanche : 10h – 13h',
  'Le Village is no longer open on Tuesdays: we now welcome you on Wednesdays, same hours, from 2:30pm to 7pm. Workshops, snacks, aperitif and board games move with it.

Our opening hours:
– Wednesday: 2:30pm – 7pm
– Friday: 4pm – 9pm
– Sunday: 10am – 1pm',
  'horaire',
  90,
  true
where not exists (
  select 1 from public.evenements
  where type = 'info' and titre = 'Le café ouvre le mercredi, plus le mardi'
);

-- La notification de septembre annonçait « les mardis ne changent pas ».
update public.evenements
set
  description = 'Le Village retrouve son horaire classique du vendredi : 16h – 21h.

Les heures d''été, qui nous faisaient fermer à 22h, sont derrière nous jusqu''à l''an prochain. Les dimanches (10h – 13h) ne changent pas, et l''après-midi de 14h30 à 19h a désormais lieu le mercredi, et non plus le mardi.',
  description_en = 'Le Village is back to its usual Friday hours: 4pm – 9pm.

The summer hours that kept us open until 10pm are behind us until next year. Sundays (10am – 1pm) are unchanged, and the 2:30pm – 7pm afternoon is now on Wednesdays instead of Tuesdays.'
where type = 'info' and titre = 'Le vendredi, retour à 21h';

-- ── Programme de novembre 2026 ──────────────────────────────────────────────
insert into public.evenements
  (type, titre, titre_en, date, heure_debut, heure_fin, lieu, lieu_en,
   description, description_en, notice, notice_en, visible)
select v.*
from (values
  ('evenement',
   'Goûter des familles',
   'Family tea time',
   date '2026-11-07', time '16:00', time '19:00',
   'Le Village, 8 rue Chalumeaux, Lyon 8e',
   'Le Village, 8 rue Chalumeaux, Lyon 8th district',
   'Costumes, crêpes et bons réflexes : un goûter partagé entre familles du quartier. Venez déguisés si le cœur vous en dit !',
   'Costumes, crêpes and good habits: a shared tea time for families in the neighbourhood. Come in costume if you feel like it!',
   null, null, true),
  ('evenement',
   'Faites du Propre !',
   'Neighbourhood clean-up',
   date '2026-11-08', time '09:30', time '12:00',
   'Le Village, 8 rue Chalumeaux, Lyon 8e',
   'Le Village, 8 rue Chalumeaux, Lyon 8th district',
   'Opération de ramassage des déchets dans le quartier, en partenariat avec Nature et Propreté Lyon. Une matinée utile et conviviale, en famille ou entre voisins : venez prêter main-forte !',
   'A litter pick in the neighbourhood, in partnership with Nature et Propreté Lyon. A useful and friendly morning with family or neighbours: come and lend a hand!',
   null, null, true),
  ('evenement',
   'Conférence « Cimetières de la Guillotière »',
   'Talk: “Cemeteries of La Guillotière”',
   date '2026-11-13', time '18:30', time '20:00',
   'École Philibert Delorme, Lyon',
   'École Philibert Delorme, Lyon',
   'Cimetières de la Guillotière, d''hier à demain… Une conférence pour découvrir l''histoire de ces lieux de mémoire du quartier et ce qu''ils deviendront.',
   'Cemeteries of La Guillotière, from yesterday to tomorrow… A talk on the history of these local places of remembrance and what lies ahead for them.',
   '⚠️ La conférence a lieu à l''École Philibert Delorme, et non au café.',
   '⚠️ The talk takes place at École Philibert Delorme, not at the café.',
   true),
  ('evenement',
   'Le Beaujolais Nouveau arrive au Village',
   'Beaujolais Nouveau comes to Le Village',
   date '2026-11-19', time '18:30', time '21:00',
   'Le Village, 8 rue Chalumeaux, Lyon 8e',
   'Le Village, 8 rue Chalumeaux, Lyon 8th district',
   'Troisième jeudi de novembre : le Beaujolais Nouveau est arrivé ! Venez le goûter entre voisins, dans la bonne humeur.',
   'Third Thursday of November: the Beaujolais Nouveau is here! Come and taste it with your neighbours.',
   null, null, true)
) as v (type, titre, titre_en, date, heure_debut, heure_fin, lieu, lieu_en,
        description, description_en, notice, notice_en, visible)
where not exists (
  select 1 from public.evenements e
  where e.titre = v.titre and e.date = v.date
);
