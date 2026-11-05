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

## Pour les développeurs

Les sources sont dans `src/` (un moteur commun + un fichier par monde + le style). Ne pas modifier le fichier HTML à la main : il est fabriqué par

```bash
node outils/assemble.js
```

Outils de test (Node, rien à installer) :

- `node outils/serveur.js` : sert le jeu sur http://localhost:4420
- `outils/bot.js` : un joueur automatique pour régler la difficulté. Ouvrir `http://localhost:4420/?banc`, charger le script dans la console, puis `joue(monde, "grand", 1, 99, terrain)`.
- `node outils/syntaxe.js` : vérifie que le script assemblé est valide.
