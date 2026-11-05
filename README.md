# Les Gardiens du Centre

Un tower defense pour le site du centre des Lilous, entièrement dessiné en code (style papier découpé) : une seule page HTML, aucune image à charger.

**▶ Jouer : https://qboyanim.github.io/les-gardiens-du-centre/**

## Le jeu

Quatre mondes, chacun avec sa propre façon de jouer et trois terrains :

| Monde | Ce qui le rend différent | Terrains |
|---|---|---|
| Le Potager | Les légumes poussent avant d'agir, on les améliore à l'arrosoir | Le jardin du Centre · Le verger · Les deux allées |
| Le Goûter | Pas de chemin : on construit soi-même le labyrinthe | La pelouse · Le ruisseau · La clairière |
| Le Château de sable | Cinq couloirs, la marée qui monte, les coquillages à ramasser | La plage · La crique · La grande marée |
| La Base spatiale | Des anneaux qu'on fait tourner, l'énergie, les fusions de tourelles | La base · Les trois anneaux · La nébuleuse |

Chaque terrain se joue en **Petit gardien** (facile) ou **Grand gardien** (le vrai défi), sur 30 vagues, avec des boss aux vagues 10, 20 et 30. Les défenseurs se débloquent au fil des vagues, et chaque bestiole a un trait (volante, blindée, bouclier, invisible, nuée…) qui demande le bon défenseur : il faut trouver le bon mélange.

Commandes : souris ou doigt ; touches 1 à 9 pour choisir un défenseur, A et Z pour les pouvoirs, Entrée pour lancer la vague, P pour la pause.

## Le poser sur un site

Le fichier `les-gardiens-du-centre.html` suffit. Pour l'intégrer dans une page existante, il faut le `<div id="gdc">`, le `<style>` et le `<script>` ; tout est préfixé `gdc` pour ne rien casser autour.

### Les fêtes : le jeu suit le thème du site

Le jeu s'habille selon la fête : guirlande au-dessus du cadre, couleurs, sol et décor du plateau, chapeaux des bestioles et cadeaux.

| Fête | Ce qui change |
|---|---|
| `habituel` | rien, c'est la tenue de tous les jours |
| `halloween` | herbe d'automne, citrouilles, tas de feuilles, chauves-souris, toiles d'araignée, chapeaux de sorcière |
| `noel` | l'herbe devient neige (sable et chemins givrés), sapins, bonshommes de neige, flocons, guirlande lumineuse, bonnets rouges |
| `carnaval` | confettis et serpentins par terre et dans l'air, fanions, chapeaux pointus |
| `paques` | herbe de printemps, œufs cachés, tulipes, fleurs, pétales, papillons, oreilles de lapin |
| `ete` | herbe dorée, pâquerettes, ballon de plage, soleil, chapeaux de paille |

Les chapeaux se posent sur la tête de chaque bestiole : `yeux()` la repère tout seul ; une bestiole qui dessine ses yeux à la main appelle `marqueTete(x, y, taille)`.

La liaison est expliquée en tête de `src/fetes.js` (cherchez « C'EST ICI POUR FAIRE LA LIAISON »). En bref :

```html
<!-- au chargement : avant le script du jeu -->
<script>window.LILOUS_FETE = "halloween";</script>
<!-- ou un attribut : <div id="gdc" data-fete="halloween">, <html data-fete="…"> ou <body data-theme="…"> -->
```

```js
// en direct, quand le site change de thème
window.GardiensDuCentre.fete("Noël / Hiver");
document.dispatchEvent(new CustomEvent("lilous:fete", { detail: "carnaval" }));
```

On peut envoyer tel quel le libellé du site (« Pâques / Printemps », « Été / Plage »…) : les majuscules et les accents ne comptent pas. Pour essayer sans rien toucher, ajoutez `?fete=halloween` à l'adresse du jeu.

## Pour les développeurs

Les sources sont dans `src/` (un moteur commun + les fêtes + un fichier par monde + le style). Ne pas modifier le fichier HTML à la main : il est fabriqué par

```bash
node outils/assemble.js
```

Outils de test (Node, rien à installer) :

- `node outils/serveur.js` : sert le jeu sur http://localhost:4420
- `outils/bot.js` : un joueur automatique pour régler la difficulté. Ouvrir `http://localhost:4420/?banc`, charger le script dans la console, puis `joue(monde, "grand", 1, 99, terrain)`.
- `node outils/syntaxe.js` : vérifie que le script assemblé est valide.
