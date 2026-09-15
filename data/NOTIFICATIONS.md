# Gérer les notifications (la cloche de la barre haute)

La cloche 🔔 en haut du site signale ce qu'il y a de neuf au Village. Elle ne
lit pas une table à part : **tout vit dans la table `evenements`**, avec deux
sortes de lignes.

| `type`      | Va dans l'agenda et sur l'accueil | Va dans la cloche |
|-------------|:---------------------------------:|:-----------------:|
| `evenement` | ✅                                | ✅                |
| `info`      | ❌                                | ✅                |

Autrement dit : **chaque évènement est déjà une notification**, sans rien
saisir de plus. Les lignes `info` servent à tout le reste — changement
d'horaire, nouveauté sur le site, message du CA.

## Mettre les colonnes en place (une seule fois)

Supabase → projet du Village → **SQL Editor**, coller le contenu de
[`supabase/2026-09-15_notifications.sql`](../supabase/2026-09-15_notifications.sql),
**Run**. Le script est idempotent, on peut le relancer.

Il ajoute les colonnes ci-dessous à `evenements` et crée la vue
`notifications_actives`, que le site interroge pour la cloche. Tant que ce
script n'est pas passé, la cloche ne s'affiche pas et le reste du site
fonctionne comme avant.

> Les évènements déjà en base prennent comme date de parution le jour où vous
> lancez le script : ils apparaissent donc tous dans la cloche ce jour-là.

## Publier une information (pas un évènement)

Supabase → **Table Editor** → table `evenements` → **Insert row** :

- `type` : **`info`**
- `titre` (+ `titre_en`), `resume` (+ `resume_en`), `description` (+ `description_en`)
- `icone` : `info`, `horaire`, `site`, `evenement` ou `alerte`
- `notif_jours` : combien de jours elle reste dans la cloche
- laisser `date` **vide** — c'est ce qui la tient hors de l'agenda
- laisser `visible` coché

## Combien de temps une notification reste-t-elle ?

| Cas | Fin de la notification |
|-----|------------------------|
| `notif_jours` rempli | `notif_debut` + ce nombre de jours |
| Évènement sans `notif_jours` | le lendemain de l'évènement, à minuit |
| Info sans `notif_jours` | 30 jours après la parution |

Un évènement disparaît donc tout seul de la cloche une fois passé, sans rien
faire. Une info sur les horaires détaillés, elle, gagne à être laissée
longtemps : mettez-lui `notif_jours` à 180 ou 365. À l'inverse, `notif_jours`
sur un évènement permet de raccourcir ou de prolonger son passage dans la
cloche.

`notif_debut` vaut la date de création. La mettre **dans le futur** programme
l'apparition de la notification.

## Les colonnes ajoutées

| Champ         | Pour qui    | Exemple                                        |
|---------------|-------------|------------------------------------------------|
| `type`        | tous        | `evenement` (défaut) ou `info`                 |
| `resume`      | tous        | `Le Village ferme à 22h les vendredis d'été.`  |
| `resume_en`   | tous        | `We now close at 10pm on summer Fridays.`      |
| `icone`       | tous        | `horaire` — vide = calendrier pour un évènement |
| `notif_jours` | tous        | `180`                                          |
| `notif_debut` | tous        | `now()` par défaut                             |

Le **texte complet** de la pop-up, c'est la colonne `description` que vous
connaissez déjà ; le `resume` n'est que la phrase affichée dans la liste.
Laissé vide, le site prend le début de la description. Pour une info, le champ
`lien_inscription` (et ses libellés) sert de bouton « En savoir plus ».

Sans traduction anglaise, le site affiche le texte français aux visiteurs
anglophones : mieux vaut un texte compréhensible que rien du tout.

## Ce que voient les visiteurs

- Une **pastille rouge** sur la cloche tant qu'il reste quelque chose qu'ils
  n'ont pas ouvert. L'état « lu » est gardé **dans leur navigateur** (le site
  public n'a pas de comptes) : il est propre à chaque appareil.
- Au clic : un **panneau** sous la cloche. Un évènement y affiche sa date, une
  info son ancienneté.
- Au clic sur un évènement : la **pop-up habituelle** de l'évènement, avec sa
  photo, son lieu et son bouton de billetterie.
- Au clic sur une info : une pop-up sobre — titre, résumé, texte complet — le
  reste du site flouté derrière.

## Bon à savoir

- La fenêtre d'affichage est appliquée par la **vue** `notifications_actives`,
  pas par le site : une ligne hors fenêtre n'est pas servie du tout. Elle ne
  pouvait pas l'être par une policy RLS, sinon l'agenda perdrait ses
  évènements passés.
- Une ligne `info` n'a pas de date, donc rien à craindre côté agenda ; le site
  écarte de toute façon les `type = 'info'` de l'agenda et de l'accueil.
- Au-delà de 30 notifications en cours, seules les 30 plus récemment parues
  sont affichées.
