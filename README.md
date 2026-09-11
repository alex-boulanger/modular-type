# Modular Type

Un générateur typographique personnel : cinq glyphes sur une grille, des modules circulaires, des raccords courbes et un export OTF côté client.

## Lancer

```sh
bun install
bun run dev
```

Sélectionner A–E et cliquer sur les points de la grille pour dessiner chaque lettre. Un clic active ou désactive un module. Glisser d'un point vers un autre crée une connexion, avec un aperçu pendant le geste ; les extrémités sont activées si nécessaire. Relâcher dans le vide ou appuyer sur Échap annule le geste.

Au clavier, Entrée et Espace basculent un point ; Maj+Entrée sur le départ puis sur l'arrivée les relie. Reset A–E restaure uniquement la lettre sélectionnée à sa recette initiale, sans changer le style global. Précédent annule la dernière modification de points, connexion, réinitialisation ou génération. La grille est optionnelle et le projet est restauré depuis localStorage.

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
    ui/                        Écran, réglages et rendu SVG
  modules/typeface/
    index.ts                   Interface publique du moteur
    types.ts                   Projet, style et contours canoniques
    recipes.ts                 Dix recettes sur la grille 5 × 7
    drawing.ts                 Points actifs et graphe des connexions
    generator.ts               Seed et paramètres corrélés
    geometry.ts                Modules, unions et contours
    connections.ts             Raccords tangents entre modules
    project.ts                 Validation et identité d'un style
    export.ts                  Conversion OTF, chargée à la demande
```

Le découpage associe une fonctionnalité complète d'édition à un module métier profond : le moteur masque recettes, géométrie, validation et conversion derrière quelques opérations. Il ne dépend ni de React, ni du DOM, ni du stockage. L'UI importe uniquement son entrée publique ; les règles ESLint protègent ces dépendances.

L'interface du moteur expose `createDefaultTypeface`, `generateTypeface`, `adjustTypeface`, `toggleGlyphPoint`, `connectGlyphPoints`, `resetGlyphDrawing`, `restoreTypeface` et `exportTypeface`. Les résultats sont à traiter comme immuables. Une modification du dessin recompile uniquement la lettre concernée. Une modification renvoie un alphabet complet ou lève une erreur ; la fonctionnalité d'édition conserve alors le dernier état valide.

Les points actifs et les connexions sont sauvegardés indépendamment pour chaque glyphe. Activer un point ajoute uniquement son module, sans raccord automatique ni découpe des liaisons qui le traversent. Désactiver un point supprime ses connexions ; le réactiver ne les recrée pas. Les liaisons sont créées explicitement par glisser-déposer. Les formes séparées et les glyphes vides sont autorisés, y compris à l'export. Le cadrage de la grille est indépendant des limites du dessin.

Toutes les connexions sont enregistrées par lettre sous forme de paires d'identifiants ordonnées et sans doublons. Elles peuvent relier des points éloignés. Reset restaure les points et connexions de la recette initiale de la lettre concernée. Les gestes de pointeur restent dans l'UI et ne modifient le projet qu'au relâchement sur une cible valide.

Les paramètres effectifs font foi après retouches. Le seed reproduit la proposition initiale avec la même version du moteur. L'export et le SVG utilisent les mêmes contours, en coordonnées typographiques entières avec un cadratin de 4000 unités. Les courbes sont échantillonnées avant union ; le rendu n'est pas reconstruit depuis le DOM.

Pour ajouter un glyphe, étendre ses recettes et le jeu de caractères du moteur. Pour changer les règles de liaison, travailler dans `drawing.ts` ; pour changer leur courbure, dans `connections.ts`. Pour ajouter une interaction, étendre les transitions de `session.ts`. Les projets des schémas 1–3 / moteurs 3.0–3.2 sont migrés au schéma 4 / moteur 4.0. Les connexions visibles sont matérialisées une seule fois pour conserver les dessins existants ; les anciennes connexions inactives sont supprimées.

## Périmètre

Le MVP se concentre sur un glyphe agrandi et les réglages. Aucun preview de mots, sélecteur de formes ou contenu de présentation. La police contient A–E et `.notdef` ; elle ne couvre pas un alphabet complet.

La validation artistique et l'installation de la police restent manuelles. Aucune suite de tests n'est ajoutée pour cette version.

[PRD](doc/prd.md) · [Référence visuelle](doc/inspi.png)
