# Gérer les notifications (la cloche de la barre haute)

La cloche 🔔 en haut du site affiche des informations qui ne sont **pas des
évènements** : mise à jour du site, changement d'horaire, message du CA…
Elles sont lues **dynamiquement** depuis une base **Supabase**
(table `notifications`), donc elles s'écrivent sans toucher au code.

Une notification reste consultable **3 mois**, puis disparaît toute seule.

## Mettre la table en place (une seule fois)

Supabase → projet du Village → **SQL Editor**, coller le contenu de
[`supabase/2026-09-15_notifications.sql`](../supabase/2026-09-15_notifications.sql),
**Run**. Le script est idempotent, on peut le relancer sans risque.

Tant que la table n'existe pas — ou s'il n'y a aucune notification en cours —
la cloche ne s'affiche pas du tout. Rien ne casse.

## Au quotidien (sans toucher au code)

Aller dans Supabase → **Table Editor** → table `notifications`.

- **Publier** : **Insert → Insert row**, remplir `titre`, `resume`, `texte`,
  choisir une `icone`, laisser `visible` coché. C'est en ligne tout de suite.
- **Programmer** : mettre une `date_publication` dans le futur, la
  notification apparaîtra d'elle-même à cette date.
- **Masquer** (sans supprimer) : décocher **`visible`**.
- **Garder en tête de liste** : cocher **`epingle`**.
- **Modifier** : double-cliquer sur une cellule.

## Les champs

| Champ              | Obligatoire | Exemple                                            |
|--------------------|:-----------:|----------------------------------------------------|
| `titre`            | ✅          | `Nouvel horaire le vendredi`                       |
| `titre_en`         |             | `New Friday hours`                                 |
| `resume`           | ✅          | `Le Village ferme à 22h les vendredis d'été.`      |
| `resume_en`        |             | `Le Village now closes at 10pm on summer Fridays.` |
| `texte`            | ✅          | Le texte complet affiché dans la pop-up            |
| `texte_en`         |             | Sa traduction anglaise                             |
| `icone`            | ✅          | `horaire` (voir la liste ci-dessous)               |
| `lien`             |             | `https://www.helloasso.com/...` (bouton en bas)    |
| `lien_label`       |             | `Voir la billetterie` — vide = « En savoir plus »  |
| `lien_label_en`    |             | `See tickets` — vide = « Learn more »              |
| `epingle`          |             | `false` par défaut                                 |
| `visible`          | ✅          | `true` par défaut                                  |
| `date_publication` | ✅          | `now()` par défaut                                 |

Sans traduction anglaise, le site affiche le texte français aux visiteurs
anglophones : mieux vaut un texte compréhensible que rien du tout.

Les retours à la ligne saisis dans `texte` sont conservés à l'affichage.

### Icônes disponibles

| Valeur      | Dessin           | Pour…                                  |
|-------------|------------------|----------------------------------------|
| `info`      | Cercle « i »     | Information générale (valeur par défaut)|
| `horaire`   | Horloge          | Changement d'horaire, fermeture         |
| `site`      | Écran            | Nouveauté sur le site                   |
| `evenement` | Calendrier       | Renvoi vers un évènement                |
| `alerte`    | Triangle         | Message important, urgent               |

La base refuse toute autre valeur : ce sont les seuls dessins que le site sait
afficher.

## Ce que voient les visiteurs

- Une **pastille rouge** sur la cloche tant qu'il reste une notification qu'ils
  n'ont pas ouverte. L'état « lu » est gardé **dans leur navigateur** (le site
  public n'a pas de comptes) : il est donc propre à chaque appareil.
- Au clic : un **panneau** sous la cloche, avec titre, résumé, date et icône.
- Au clic sur une ligne : l'**article complet** en pop-up, le reste du site
  flouté derrière.

## Bon à savoir

- La limite de 3 mois est appliquée **par la base** (policy RLS), pas par le
  site : passé ce délai, la notification n'est plus servie du tout.
- Au-delà de 30 notifications en cours, seules les 30 plus récentes
  (épinglées d'abord) sont affichées.
- Le `lien` doit commencer par `https://`, sinon la base le refuse.
