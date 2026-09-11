# Gérer les évènements du site

Les évènements affichés sur le site (page d'accueil, agenda et pop-up) sont
désormais lus **dynamiquement** depuis une base **Supabase** (table `evenements`).
Plus besoin de modifier le code : tout se gère depuis le tableau de bord Supabase.

## Faire évoluer la table

La table est déjà en place. Les scripts SQL qui lui ajoutent des colonnes vivent
dans le dossier [`supabase/`](../supabase). Pour en appliquer un : Supabase →
projet du Village → **SQL Editor**, coller le contenu du fichier, **Run**. Les
scripts sont idempotents, on peut les relancer.

| Script | Effet |
|--------|-------|
| [`2026-09-11_lien-inscription.sql`](../supabase/2026-09-11_lien-inscription.sql) | Ajoute `lien_inscription`, `lien_inscription_label`, `lien_inscription_label_en` |

## Au quotidien (sans toucher au code)

Aller dans Supabase → **Table Editor** → table `evenements`.

- **Ajouter un évènement** : bouton **Insert → Insert row**, remplir les champs,
  laisser `visible` coché. Il apparaît automatiquement sur le site.
- **Masquer un évènement** (sans le supprimer) : décocher la case **`visible`**.
- **Supprimer définitivement** : sélectionner la ligne → **Delete**.
- **Modifier** : double-cliquer sur une cellule.

> Astuce : un évènement dont la date est passée bascule tout seul dans
> « Évènements passés » de l'agenda. Pas besoin de le supprimer.

## Les champs (inspirés de l'évènement Guinguette)

| Champ               | Obligatoire | Exemple                                   |
|---------------------|:-----------:|-------------------------------------------|
| `titre`             | ✅          | `La Guinguette du village`                |
| `titre_en`          |             | `Village Guinguette`                      |
| `date`              | ✅          | `2026-06-20` (AAAA-MM-JJ)                 |
| `heure_debut`       |             | `17:00`                                   |
| `heure_fin`         |             | `22:00`                                   |
| `lieu`              |             | `Le Village, 8 rue Chalumeaux, Lyon 8e`   |
| `lieu_en`           |             | `Le Village, 8 rue Chalumeaux, Lyon 8th`  |
| `description`       |             | texte libre (les retours à la ligne sont gardés) |
| `description_en`    |             | version anglaise                          |
| `notice`            |             | `⚠️ Le café sera fermé le vendredi…`      |
| `notice_en`         |             | version anglaise du `notice`              |
| `confirmation_mail` |             | `contact@cafe-levillage.org`              |
| `photo`             |             | `guinguette-2026.jpg` (voir ci-dessous)   |
| `photo_alt`         |             | description de l'image (accessibilité)    |
| `lien_facebook`     |             | lien FB spécifique à l'évènement          |
| `lien_instagram`    |             | lien Insta spécifique à l'évènement       |
| `lien_inscription`  |             | `https://www.helloasso.com/…` (voir ci-dessous) |
| `lien_inscription_label`    |     | `Réserver un emplacement`                 |
| `lien_inscription_label_en` |     | `Book a pitch`                            |
| `visible`           | ✅          | coché = affiché, décoché = masqué         |

## Ajouter un bouton d'inscription

Coller l'URL de la page HelloAsso de l'évènement dans `lien_inscription` (elle
doit commencer par `https://`, sinon le bouton n'est pas affiché). Un bouton
orange apparaît alors sur la carte de l'accueil et dans la pop-up.

Le texte du bouton est « Réserver ma place » / « Book my place » par défaut.
Pour le changer, remplir `lien_inscription_label` et `lien_inscription_label_en`.

Le visiteur reste sur le site : le bouton ouvre HelloAsso dans un nouvel onglet,
sans charger de cadre tiers dans la page (contrairement au formulaire
d'adhésion, qui lui est intégré et demande un consentement).

## Ajouter une image

1. Déposer le fichier image dans le dossier **`assets/images/`** du dépôt
   (par ex. `assets/images/fete-musique.jpg`) et le pousser sur GitHub.
2. Dans Supabase, écrire **uniquement le nom du fichier** dans la colonne
   `photo` : `fete-musique.jpg`.

Le site cherche les images dans `assets/images/`. On peut aussi coller une URL
complète (`https://…`) si l'image est hébergée ailleurs.

## En cas de panne de Supabase

Il n'y a pas de source de secours : l'accueil et l'agenda affichent un message
d'indisponibilité qui renvoie vers le mainteneur du site. Le fichier
`data/evenements.json` vient de l'ancienne version statique du site ; plus aucun
script ne le lit.
