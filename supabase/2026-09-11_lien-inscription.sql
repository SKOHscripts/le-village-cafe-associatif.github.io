-- Le Village — table `evenements`
-- Ajoute un lien de billetterie/inscription (HelloAsso) affichable en bouton
-- sur la carte d'un évènement et dans la pop-up d'accueil.
--
-- À coller dans Supabase → SQL Editor → Run. Le script est idempotent :
-- on peut le relancer sans risque.

alter table public.evenements
  add column if not exists lien_inscription          text,
  add column if not exists lien_inscription_label    text,
  add column if not exists lien_inscription_label_en text;

comment on column public.evenements.lien_inscription is
  'URL https de la billetterie (page HelloAsso de l''évènement). Vide = pas de bouton.';
comment on column public.evenements.lien_inscription_label is
  'Texte du bouton en français. Vide = « Réserver ma place ».';
comment on column public.evenements.lien_inscription_label_en is
  'Texte du bouton en anglais. Vide = « Book my place ».';

-- Le site n'affiche le bouton que pour une URL en https.
alter table public.evenements
  drop constraint if exists evenements_lien_inscription_https;
alter table public.evenements
  add constraint evenements_lien_inscription_https
  check (lien_inscription is null or lien_inscription ~ '^https://');

-- Brocante « Les trouvailles du village » (10 octobre 2026) : bouton vers la
-- billetterie HelloAsso. L'évènement est déjà en base, seul le lien manque.
update public.evenements
set    lien_inscription          = 'https://www.helloasso.com/associations/cafe-associatif-le-village/evenements/les-trouvailles-du-village',
       lien_inscription_label    = 'Réserver un emplacement',
       lien_inscription_label_en = 'Book a pitch'
where  id = '82ee5e1e-36ac-4938-aede-812810720db2';
