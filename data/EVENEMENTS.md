# Gérer les évènements du site

Les évènements affichés sur le site (page d'accueil, agenda et pop-up) sont
désormais lus **dynamiquement** depuis une base **Supabase** (table `evenements`).
Plus besoin de modifier le code : tout se gère depuis le tableau de bord Supabase.

## Première installation (à faire une seule fois)

1. Ouvrir [Supabase](https://supabase.com) → projet du Village → **SQL Editor**.
2. Coller le contenu de [`supabase/evenements.sql`](../supabase/evenements.sql)
   et cliquer sur **Run**. Cela crée la table, la sécurité (RLS) et importe les
   évènements existants (dont la Guinguette).

Tant que la table n'existe pas, le site continue de fonctionner en lisant le
fichier de secours `data/evenements.json`.

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
| `visible`           | ✅          | coché = affiché, décoché = masqué         |

## Ajouter une image

1. Déposer le fichier image dans le dossier **`assets/images/`** du dépôt
   (par ex. `assets/images/fete-musique.jpg`) et le pousser sur GitHub.
2. Dans Supabase, écrire **uniquement le nom du fichier** dans la colonne
   `photo` : `fete-musique.jpg`.

Le site cherche les images dans `assets/images/`. On peut aussi coller une URL
complète (`https://…`) si l'image est hébergée ailleurs.

## En cas de panne de Supabase

Le site retombe automatiquement sur `data/evenements.json`. Ce fichier sert de
filet de sécurité : il n'est pas nécessaire de le tenir à jour au quotidien.
