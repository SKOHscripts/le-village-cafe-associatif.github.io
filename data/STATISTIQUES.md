# Statistiques de visite du site

Le site compte ses visites dans la base **Supabase** du Village (table `visites`),
sans outil supplémentaire. La mesure est **anonyme** : pas de cookie, pas
d'adresse IP, pas d'identifiant de visiteur. Elle est signalée aux visiteurs
sur la page [Contact](../contact.html#mesure-audience).

## Mise en place (une seule fois)

Supabase → projet du Village → **SQL Editor** → coller le contenu de
[`supabase/2026-09-27_visites.sql`](../supabase/2026-09-27_visites.sql) → **Run**.

Tant que ce script n'a pas été lancé, le site fonctionne normalement : les
envois échouent en silence et rien n'est compté.

## Ce qui est compté

Le script [`assets/js/stats.js`](../assets/js/stats.js), chargé sur toutes les
pages, ajoute une ligne à la table `visites` :

| `type` | Quand | Colonnes utiles |
|--------|-------|-----------------|
| `page` | à chaque page affichée | `page`, `entree` (première page de la visite), `source` (provenance, sur la première page) |
| `clic` | clic sur un bouton « Adhérer » ou sur la page HelloAsso d'adhésion | `cible = adherer` |
| `clic` | clic sur une billetterie HelloAsso d'évènement (« Réserver ma place ») | `cible = inscription` |

La **provenance** (`source`) vaut :

- `qr` pour un scan du QR code de l'affiche ([`decouvrir.html`](../decouvrir.html)) ;
- `instagram`, `facebook`, `google`, `bing`, `duckduckgo`, `qwant`, `ecosia`,
  `helloasso`, ou le domaine du site d'origine pour les autres ;
- vide (affiché `direct`) quand on tape l'adresse ou qu'on vient d'un favori.

Les visites en local et les robots ne sont pas comptés.

## Lire les chiffres

Supabase → **Table Editor** → rubrique **Views** (ou `select * from … ;` dans
le SQL Editor) :

| Vue | Contenu |
|-----|---------|
| `stats_par_jour` | par jour : visites, pages vues, clics « Adhérer », clics billetterie |
| `stats_pages_30j` | pages les plus vues sur 30 jours |
| `stats_sources_par_mois` | d'où viennent les visites, mois par mois |
| `stats_clics_par_mois` | clics « Adhérer » et billetterie, par mois et par page |

> Une **visite** = une personne qui arrive sur le site dans un onglet.
> Si elle consulte 5 pages, cela fait 1 visite et 5 pages vues.

## Suivre un lien partagé

Ajouter `?utm_source=…` à un lien vers le site permet de le reconnaître dans
`stats_sources_par_mois`. Par exemple, pour le lien en bio Instagram :

```
https://cafe-levillage.org/?utm_source=bio-instagram
```

Lettres minuscules, chiffres, `.`, `_` et `-` uniquement. Le paramètre
disparaît de la barre d'adresse une fois la page ouverte, pour qu'un lien
recopié ne soit pas compté deux fois.

## Limites

- Le formulaire HelloAsso de la page Adhésion est un cadre externe : on compte
  les clics qui mènent vers l'adhésion, pas les adhésions payées (celles-ci
  sont déjà comptées par [`adhesions-stats.json`](adhesions-stats.json)).
- La clé publique du site peut ajouter des lignes : quelqu'un de malveillant
  pourrait gonfler les chiffres. Les contraintes de la table limitent ce qui
  peut être écrit, mais les chiffres restent indicatifs.
