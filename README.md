# Modular Type

Un générateur typographique personnel : un alphabet dessiné sur une grille adaptative, des modules circulaires, des raccords courbes et un export OTF côté client.

## Lancer

```sh
bun install
bun run dev
```

Sélectionner une lettre et cliquer sur les points de la grille pour la dessiner. Un clic active ou désactive un module. Glisser d'un point vers un autre crée une connexion, avec un aperçu pendant le geste ; les extrémités sont activées si nécessaire. Relâcher dans le vide ou appuyer sur Échap annule le geste.

Au clavier, Entrée et Espace basculent un point ; Maj+Entrée sur le départ puis sur l'arrivée les relie. Reset restaure uniquement la lettre sélectionnée à sa recette initiale, sans changer le style global ni la grille. Undo et Redo parcourent les dernières modifications de points, connexions, grille, réinitialisation ou génération. La grille est optionnelle et le projet est restauré depuis localStorage.

Les onglets en marge du canevas déplacent les lignes de la grille, partagée par toutes les lettres : colonnes en haut, rangées à gauche. Les nœuds suivent leurs lignes et chaque module prend la taille de sa cellule, dans la mesure fixée par le réglage Cell fit : à 0, tous les nœuds gardent la même taille. Le cadre et la ligne de base sont fixes. Les flèches déplacent l'onglet sélectionné (Maj pour un grand pas), un double-clic ou Suppr remet la ligne à sa place régulière, Échap annule un glissement. Randomize tire une nouvelle grille ; Reset grid revient à la grille régulière. Generate tire aussi une grille.

Preview ouvre une fenêtre où l'on tape un texte libre, composé avec la police telle qu'elle sera exportée.

```sh
bun run build
bun run lint
```

## Organisation

```text
src/
  App.tsx                      Assemblage de l'application
  features/type-studio/
    index.ts                   Entrée publique de la fonctionnalité
    model/session.ts           Transitions atomiques de l'éditeur
    model/persistence.ts       Lecture et écriture du stockage navigateur
    model/use-type-studio.ts    Liaison React et téléchargement
    model/use-font-preview.ts   Police exportée chargée dans la page pour l'aperçu
    ui/                        Écran, réglages, aperçu et rendu SVG
  modules/typeface/
    index.ts                   Interface publique du moteur
    types.ts                   Projet, style et contours canoniques
    recipes.ts                 Recettes sur la grille 5 × 9
    drawing.ts                 Points actifs et graphe des connexions
    grid.ts                    Grille adaptative : limites et tirages
    generator.ts               Seed et paramètres corrélés
    geometry.ts                Modules, unions et contours
    connections.ts             Raccords tangents entre modules
    project.ts                 Validation et identité d'un style
    export.ts                  Conversion OTF, chargée à la demande
```

Le découpage associe une fonctionnalité complète d'édition à un module métier profond : le moteur masque recettes, géométrie, validation et conversion derrière quelques opérations. Il ne dépend ni de React, ni du DOM, ni du stockage. L'UI importe uniquement son entrée publique ; les règles ESLint protègent ces dépendances.

L'interface du moteur expose `createDefaultTypeface`, `generateTypeface`, `adjustTypeface`, `toggleGlyphPoint`, `connectGlyphPoints`, `disconnectGlyphPoints`, `clearGlyphDrawing`, `resetGlyphDrawing`, `moveGridLine`, `previewGridLine`, `resetGridLine`, `randomizeGrid`, `resetGrid`, `restoreTypeface` et `exportTypeface`. Les résultats sont à traiter comme immuables. Une modification du dessin recompile uniquement la lettre concernée ; une modification de la grille recompile toute la police. Une modification renvoie un alphabet complet ou lève une erreur ; la fonctionnalité d'édition conserve alors le dernier état valide.

Les points actifs et les connexions sont sauvegardés indépendamment pour chaque glyphe. Activer un point ajoute uniquement son module, sans raccord automatique ni découpe des liaisons qui le traversent. Désactiver un point supprime ses connexions ; le réactiver ne les recrée pas. Les liaisons sont créées explicitement par glisser-déposer. Les formes séparées et les glyphes vides sont autorisés, y compris à l'export. Le cadrage de la grille est indépendant des limites du dessin.

Toutes les connexions sont enregistrées par lettre sous forme de paires d'identifiants ordonnées et sans doublons. Elles peuvent relier des points éloignés. Reset restaure les points et connexions de la recette initiale de la lettre concernée. Les gestes de pointeur restent dans l'UI et ne modifient le projet qu'au relâchement sur une cible valide.

La grille est stockée en intervalles relatifs, quatre colonnes et huit rangées ; une grille régulière ne contient que des 1. Seuls les deux intervalles voisins d'une ligne déplacée changent, et aucun ne descend sous 30 % d'un intervalle régulier. Un module prend, sur chaque axe, la moyenne des intervalles voisins de son nœud, pondérée par Cell fit, dans les limites des métriques verticales ; sur une grille régulière, les contours sont identiques à ceux d'une grille fixe. Un glissement de ligne ne compile que la lettre affichée ; le projet change au relâchement.

Les paramètres effectifs font foi après retouches. Le seed reproduit la proposition initiale, grille comprise, avec la même version du moteur. L'export, l'aperçu et le SVG utilisent les mêmes contours, en coordonnées typographiques entières avec un cadratin de 4000 unités. Les courbes sont échantillonnées avant union ; le rendu n'est pas reconstruit depuis le DOM. L'aperçu compile l'OTF à son ouverture et le charge dans la page avec l'API FontFace ; seule la police du dernier design y reste installée.

Pour ajouter un glyphe, étendre ses recettes et le jeu de caractères du moteur. Pour changer les règles de liaison, travailler dans `drawing.ts` ; pour changer leur courbure, dans `connections.ts`. Pour changer les règles de la grille (lignes fixes, écart minimal, amplitude des tirages), travailler dans `grid.ts` ; pour la taille des modules selon leur cellule, dans `geometry.ts`. Pour ajouter une interaction, étendre les transitions de `session.ts`. Les projets des schémas 1–5 / moteurs 3.0–5.0 sont migrés au schéma 6 / moteur 6.0 et gardent la grille régulière sur laquelle ils ont été dessinés. Pour les schémas 1–3, les connexions visibles sont matérialisées une seule fois pour conserver les dessins existants ; les anciennes connexions inactives sont supprimées.

## Périmètre

Le MVP se concentre sur un glyphe agrandi et les réglages, avec un aperçu de texte dans la police exportée. Aucun sélecteur de formes ni contenu de présentation. La police contient A–Z, a–z, 0–9, `. , ! ? -`, l'espace et `.notdef`. La grille est commune à toutes les lettres ; une grille propre à chaque lettre est reportée après la V1.

La validation artistique et l'installation de la police restent manuelles. Aucune suite de tests n'est ajoutée pour cette version.

[PRD](doc/prd.md) · [Référence visuelle](doc/inspi.png)
