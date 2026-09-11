# Modular Type Generator — PRD MVP

- Version : 0.5
- Statut : MVP à valider visuellement par l'auteur
- Destination : projet artistique personnel, destiné au portfolio de développement
- Plateforme : web, desktop-first
- Stack : React + TypeScript + SVG + Vite
- Export : police installable OTF, entièrement côté client
- Glyphes : A, B, C, D et E
- Référence artistique : [inspi.png](inspi.png)

## 1. Intention

Créer un éditeur de typographie modulaire où l'utilisateur dessine ses propres lettres en activant et désactivant les points de la grille. L'auteur est l'utilisateur principal et valide lui-même le résultat dans le navigateur.

La priorité est la qualité des lettres : modules généreux, raccords courbes, rythme des formes et contreformes lisibles. La référence montre des masses circulaires reliées par des courbes concaves et continues.

L'interface doit permettre de travailler ces formes directement, avec très peu de contenu autour.

## 2. Périmètre actuel

- Cinq glyphes sur une grille logique 5 × 7.
- Deux recettes par glyphe, avec des nœuds placés intentionnellement.
- Activation et désactivation des 35 points de chaque lettre, indépendamment des autres lettres.
- Création de connexions par glisser-déposer entre deux points, même éloignés.
- Réinitialisation du dessin de chaque lettre indépendamment du style global.
- Une seule famille de primitives : les modules circulaires.
- Deux modes de raccord : Union et Bridge.
- Six réglages globaux : largeur, hauteur, masse, espacement, arrondi et contraste.
- Génération déterministe avec paramètres corrélés.
- Un glyphe affiché en grand, sélection A–E et grille optionnelle.
- Retour au résultat précédent, restauration locale et export OTF.

Hors périmètre : modules carrés et capsules, previews de mots, compositions décoratives, galerie de styles, slogans et contenu de présentation. Également hors périmètre : alphabet complet, déplacement libre des points, édition Bézier, kerning avancé, import de police, comptes, cloud et collaboration.

La suite de tests est reportée à la V2. Le MVP reste vérifié par la compilation, le lint et des contrôles ponctuels de fonctionnement.

## 3. Interface

Une page contenant :

- un en-tête compact avec Generate, Précédent et Export OTF ;
- un espace principal pour le glyphe sélectionné ;
- cinq boutons A–E et une case Grille ;
- un panneau de réglages.

La grille se superpose discrètement au cadrage. Chaque point est cliquable, même sous la forme noire, et indique son état actif ou inactif. Entrée et Espace permettent de le basculer au clavier. Les nœuds ne sont pas déplaçables. Le cadre de visualisation reste fixé à la grille : retirer un point extérieur ne doit pas déplacer les autres cibles de clic.

Glisser entre deux points affiche une liaison provisoire et crée la connexion au relâchement. Les extrémités inactives sont activées. Relâcher dans le vide, revenir au point de départ ou appuyer sur Échap annule la création. Un petit mouvement involontaire reste un clic ; un drag ne doit jamais désactiver le point de départ. Au clavier, Maj+Entrée sélectionne successivement le départ et l'arrivée.

Le bouton Reset de la lettre sélectionnée restaure les points de sa recette initiale et retire ses connexions manuelles. Le style global et les autres lettres sont conservés. Précédent permet d'annuler cette réinitialisation.

Aucun sélecteur de formes n'est nécessaire puisqu'une seule primitive est disponible.

## 4. Géométrie et esthétique

Chaque recette décrit des nœuds et leurs connexions sur la grille. Les nœuds constituent les modules réellement visibles : le moteur n'ajoute pas automatiquement une perle à chaque intersection de grille.

Les recettes sont des points de départ. Désactiver un point retire son module et supprime ses connexions. Activer un point ajoute uniquement son module, sans raccord automatique ni découpe des liaisons qui le traversent. Réactiver un point ne recrée aucune liaison supprimée ; l'utilisateur les dessine explicitement par glisser-déposer.

Les connexions initiales et dessinées sont stockées dans un même graphe explicite par lettre, sans doublons, entre des points actifs. Un drag relie uniquement ses deux extrémités, même si d'autres points sont sur son trajet. Les connexions utilisent les mêmes raccords et le même pipeline d'export que les liaisons initiales.

Les cercles peuvent être déformés par le contraste. Les raccords sont construits par des courbes tangentes aux modules ; leurs côtés concaves donnent une continuité organique aux masses.

Union produit des raccords plus pleins. Bridge permet des cols plus fins. Les deux modes conservent les recettes.

| Réglage | Effet |
| --- | --- |
| Largeur | Étire la grille horizontalement |
| Hauteur | Étire la grille verticalement à corps constant |
| Masse | Augmente le volume des modules et des raccords |
| Espacement | Rétracte les modules et ajuste la plénitude relative des raccords à grille fixe |
| Arrondi | Module la concavité des raccords |
| Contraste | Renforce les verticales et affine les horizontales |

Les contraintes géométriques maintiennent des contours fermés et compatibles avec les métriques de la police. Un glyphe peut contenir plusieurs parties séparées ou être vide pendant le dessin ; ces états restent exportables. Les minuscules trous parasites issus des unions sont nettoyés sans supprimer les contreformes des lettres.

La reconnaissance et l'intérêt artistique sont évalués par l'auteur ; une géométrie valide ne suffit pas à les garantir.

## 5. Génération et édition

Generate crée un seed, dérive des paramètres corrélés depuis un DNA interne et sélectionne des recettes compatibles. La génération reste bornée en cas de rejet d'un candidat.

Les cinq glyphes sont calculés et validés avant de remplacer le projet actif. Une erreur conserve le dernier résultat valide.

Les réglages manuels modifient le style effectif sans réappliquer le DNA. Les valeurs affichées correspondent aux valeurs utilisées par le moteur.

Chaque bascule de point, nouvelle connexion, Reset et Generate conserve un instantané complet du projet remplacé. Précédent le restaure, points, connexions et retouches compris. Un geste annulé ou un lien déjà présent ne remplace pas cet instantané. Un seul retour est requis ; il ne s'agit pas d'un historique de chaque mouvement de slider. Generate remplace le dessin et le style ; les réglages manuels de style conservent les points et connexions dessinés.

## 6. État et persistance

Le projet contient la version du schéma, celle du moteur, le seed, le DNA, le style effectif, les variantes de recette, les points actifs et toutes les connexions explicites par lettre.

Le seed reproduit la proposition initiale à version du moteur identique. Après retouches, l'état complet fait foi.

La sauvegarde locale contient le projet courant, le projet précédent et la vue : glyphe sélectionné et visibilité de la grille. Les contours sont recalculés à la restauration.

Les données chargées sont validées. Une sauvegarde incompatible ou corrompue produit un message et un retour au projet initial. L'indisponibilité du stockage n'empêche pas l'édition ou l'export.

Les sauvegardes des schémas 1 à 3 (moteurs 3.0 à 3.2) sont migrées au schéma 4 / moteur 4.0 sans perdre leurs réglages ni leurs dessins visibles. Les points manquants sont initialisés depuis les recettes. Les anciennes règles de liaison sont appliquées une seule fois à la migration pour matérialiser les connexions visibles ; les liens inactifs sont supprimés.

## 7. Pipeline et export

```text
Recettes + style effectif
→ Modules circulaires et raccords courbes
→ Unions géométriques
→ Nettoyage et contours canoniques
→ Preview SVG et export OTF
```

Les contours canoniques sont communs au preview et à l'export. Les courbes sont échantillonnées avant union et quantifiées sur un cadratin de 4000 unités pour limiter les facettes à grande taille.

Métriques : unitsPerEm = 4000, ascender = 3200, descender = -800. Chaque glyphe possède une avance calculée à partir de sa largeur et de marges latérales communes.

La police contient A–E aux Unicode U+0041–U+0045 et `.notdef`. Les noms de fichier et les noms internes distinguent les retouches issues d'un même seed.

L'export OTF utilise opentype.js, chargé à la demande. La police n'est pas compilée à chaque mouvement de slider. Une erreur d'export conserve le projet.

La fidélité attendue concerne les contours et les métriques ; l'anticrénelage peut varier entre le navigateur et les applications utilisant la police installée.

## 8. Architecture

La fonctionnalité `type-studio` regroupe l'état d'édition, la persistance, les interactions et l'UI. Elle consomme uniquement l'interface publique de `modules/typeface`.

Le moteur typographique encapsule les recettes, la génération, les contraintes géométriques, les contours et l'export. Il ne dépend pas de React, du DOM ou du stockage navigateur.

Les modifications sont atomiques : la fonctionnalité reçoit un alphabet valide ou conserve le précédent. Les détails des unions et des raccords ne remontent pas dans les réglages React.

## 9. Validation du MVP

- L'auteur juge les cinq lettres et leurs variantes dans le navigateur, en les comparant à l'inspiration.
- Les 35 points sont activables et désactivables sur chaque lettre, sans modifier les autres lettres.
- Les points ajoutés ou retirés sont conservés au changement de lettre, après refresh et à l'export.
- Le drag crée une seule connexion sans basculer les extrémités par erreur ; un geste annulé ne modifie pas le projet.
- Reset restaure seulement la lettre sélectionnée et peut être annulé.
- Les connexions manuelles sont conservées au changement de lettre, après refresh et à l'export.
- Les réglages produisent des effets compréhensibles et préservent les contreformes.
- Generate propose des résultats reproductibles et visuellement intéressants.
- Précédent et le refresh préservent les retouches attendues.
- L'export produit une police installable dont les contours correspondent au preview.
- Les interactions restent fluides sur desktop.

Cibles : slider vers rendu inférieur à 50 ms, Generate inférieur à 200 ms, sélection de glyphe inférieure à 100 ms et export inférieur à 2 s. Les mesures ponctuelles du moteur ne remplacent pas la validation perceptuelle dans le navigateur.

Navigateurs visés : Chrome, Safari et Firefox desktop. La validation artistique et l'installation dans une application cible restent à effectuer par l'auteur.
