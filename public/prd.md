PRD --- Modular Type Generator MVP

Version: 0.1
Status: MVP
Platform: Web, desktop-first
Stack cible: React + TypeScript + SVG
Output: TTF
Scope initial: 5 glyphes --- A, B, C, D, E

1. Vision

Créer un éditeur typographique browser-based permettant de générer une
vraie police TTF à partir d'un système modulaire basé sur une grille.

L'utilisateur ne dessine pas directement les contours de chaque lettre.
Il part d'un set de glyphes par défaut et manipule un nombre réduit de
paramètres globaux. Le système transforme ces paramètres en géométrie
tout en maintenant une cohérence typographique entre les glyphes.

Le MVP doit démontrer qu'un même alphabet source de cinq lettres peut
produire rapidement des designs visuellement variés, reconnaissables et
exportables comme une vraie font.

2. Objectif du MVP

Valider le workflow principal :

Generate → Adjust → Preview → Export TTF

Le MVP est réussi si un utilisateur peut :

ouvrir l'application ;

voir les cinq glyphes par défaut ;

générer plusieurs variations cohérentes ;

ajuster leur style avec des contrôles simples ;

prévisualiser les glyphes ensemble ;

exporter une police .ttf installable contenant A, B, C, D et E.

L'expérience doit privilégier l'exploration visuelle plutôt que la
précision d'un éditeur typographique professionnel.

3. Non-objectifs

Le MVP ne comprend pas :

alphabet complet ;

minuscules ;

chiffres et ponctuation ;

édition manuelle des courbes Bézier ;

kerning avancé ;

ligatures ;

OpenType Features ;

variable fonts ;

hinting manuel ;

import de fonts ;

comptes utilisateurs ;

collaboration ;

sauvegarde cloud ;

interface mobile complète.

4. Principe de construction

4.1 Grille

Tous les glyphes sont construits sur une grille logique commune.

Pour le MVP, utiliser une grille 5 × 7.

· · ● · ·
· ● · ● ·
● · · · ●
● ● ● ● ●
● · · · ●
● · · · ●
● · · · ●

Les coordonnées de la grille sont indépendantes des pixels et des unités
finales de la font.

type GridPoint = {
x: number // 0 → 4
y: number // 0 → 6
}

Le moteur transforme ensuite ces coordonnées logiques en coordonnées SVG
pour le preview et en unités typographiques pour le TTF.

4.2 Glyph Recipe

Chaque lettre est décrite par une recette abstraite et non par son
contour final.

type GlyphRecipe = {
char: "A" | "B" | "C" | "D" | "E"
nodes: Node[]
connections: Connection[]
}

Une recette contient :

les nœuds actifs sur la grille ;

les connexions entre ces nœuds ;

une topologie ;

les éventuelles informations spécifiques au glyphe.

La recette décrit la structure de la lettre. Son apparence est
déterminée ensuite par le système stylistique.

5. Glyphes du MVP

Le set initial contient :

A B C D E

Ces caractères couvrent plusieurs problématiques géométriques :

Glyphe Cas testé

A diagonales + traverse
B verticale + bowls
C forme ouverte
D verticale + courbe
E verticales + horizontales

Les cinq caractères doivent partager le même langage graphique.

6. Variantes topologiques

Chaque lettre possède deux recettes structurelles.

Le MVP contient donc :

5 glyphes × 2 variantes = 10 GlyphRecipes

Exemples de variations possibles :

A avec sommet pointu ou sommet plat ;

B avec deux bowls égaux ou bowl inférieur plus large ;

C ouvert au centre ou davantage sur la droite ;

D arrondi ou plus rectangulaire ;

E avec traverse centrale courte ou longue.

Une variante doit modifier la personnalité du caractère sans
compromettre sa reconnaissance.

7. Pipeline de génération

Le moteur doit être déterministe.

Glyph Recipe
↓
Grid transformation
↓
Style DNA
↓
Module generation
↓
Connection generation
↓
Boolean union
↓
Contour cleanup
↓
Glyph outline
↓
OpenType conversion
↓
TTF

À paramètres et seed identiques, le résultat doit être strictement
identique.

8. Style DNA

Une font possède un style global partagé par les cinq glyphes.

type FontStyle = {
width: number
height: number
moduleSize: number
spacing: number
roundness: number
contrast: number
moduleShape: ModuleShape
connectionStyle: ConnectionStyle
}

Les paramètres continus sont normalisés entre 0 et 1.

Le moteur convertit ensuite ces valeurs normalisées vers les dimensions
géométriques nécessaires.

9. Paramètres utilisateur

Width

Contrôle la largeur globale de la grille.

Narrow ←────────→ Wide

La hauteur reste inchangée.

Height

Contrôle la hauteur globale des glyphes.

Short ←────────→ Tall

Module Size

Contrôle la masse des modules.

Light / Small ←────────→ Heavy / Large

Ce paramètre constitue le principal contrôle du poids visuel de la font.

Spacing

Contrôle la distance entre les éléments modulaires.

● ● ● → ● ● ● → ●●●

Les valeurs faibles peuvent provoquer des fusions entre modules.

Roundness

Contrôle la douceur des coins, extrémités et connexions.

Sharp ←────────→ Soft

Contrast

Contrôle la différence entre éléments horizontaux et verticaux.

À faible contraste :

vertical = 100
horizontal = 100

À fort contraste :

vertical = 140
horizontal = 70

Le comportement exact doit rester cohérent entre les cinq glyphes.

10. Module Shape

Le MVP propose trois familles de primitives :

type ModuleShape =
| "circle"
| "square"
| "capsule"

Exemples conceptuels :

Circle ●

Square ■

Capsule ━━

Changer le module doit affecter simultanément tout l'alphabet.

11. Connections

Les connexions entre deux nœuds sont générées automatiquement.

Le MVP comprend deux modes :

type ConnectionStyle =
| "union"
| "bridge"

Union

Les modules et leurs connexions forment une masse continue.

●━━●

Bridge

Une liaison plus fine connecte les modules.

●──●

Ces modes doivent produire des personnalités suffisamment différentes
sans modifier la structure fondamentale des lettres.

12. Design DNA

La génération aléatoire ne doit pas randomiser chaque slider
indépendamment.

Le système génère d'abord un petit espace latent de caractéristiques :

type DesignDNA = {
softness: number
density: number
width: number
contrast: number
weirdness: number
}

Les paramètres visibles sont ensuite dérivés de ce DNA.

Exemple :

roundness = softness
moduleSize = lerp(MIN_MODULE, MAX_MODULE, density)
spacing = 1 - density
width = lerp(MIN_WIDTH, MAX_WIDTH, dna.width)

L'objectif est de produire de la variété avec corrélation
stylistique, plutôt qu'une combinaison arbitraire de paramètres.

13. Weirdness

weirdness contrôle le niveau d'expérimentation du générateur.

Il peut influencer :

le choix d'une variante topologique ;

les proportions ;

certaines connexions ;

une asymétrie légère ;

des exceptions locales autorisées.

0.0 → conventionnel
1.0 → expérimental

Même à 1.0, les glyphes doivent rester reconnaissables.

Pour le MVP, ce paramètre peut rester interne et être utilisé uniquement
par le bouton Generate.

14. Seed

Chaque génération possède un seed.

type FontProject = {
seed: number
style: FontStyle
glyphVariants: {
A: number
B: number
C: number
D: number
E: number
}
}

Le seed permet de reproduire exactement une génération.

Un même seed avec la même version du moteur doit produire le même
résultat.

15. Generate

L'interface comporte un CTA principal :

Generate

À chaque activation :

créer un nouveau seed ;

générer un Design DNA ;

sélectionner des variantes topologiques compatibles ;

dériver les paramètres de style ;

recalculer les cinq glyphes ;

afficher immédiatement le résultat.

Le générateur doit privilégier les combinaisons considérées comme
valides.

L'objectif n'est pas d'explorer uniformément toutes les valeurs
mathématiques, mais de produire fréquemment des designs exploitables.

16. Interface

L'application doit fonctionner sur un écran desktop sans nécessiter de
navigation entre plusieurs pages.

Structure indicative :

┌────────────────────────────────────────────────┐
│ MODULAR TYPE Generate │
├────────────────────────────────┬───────────────┤
│ │ │
│ │ Width ─●─ │
│ │ Height ─●─ │
│ GLYPH VIEW │ Size ─●─ │
│ │ Spacing ─●─ │
│ A │ Roundness ─●─ │
│ │ Contrast ─●─ │
│ │ │
│ │ Shape │
│ │ ○ □ ▬ │
│ │ │
├────────────────────────────────┴───────────────┤
│ │
│ A B C D E │
│ │
├────────────────────────────────────────────────┤
│ ABCDE BAD CAB DECADE Export TTF │
└────────────────────────────────────────────────┘

17. Glyph View

La zone principale affiche le glyphe actuellement sélectionné.

Elle montre :

la grille ;

les nœuds de construction ;

les connexions ;

le résultat géométrique final.

L'utilisateur peut sélectionner :

A B C D E

pour inspecter chaque glyphe.

Pour le MVP, les nœuds ne sont pas déplaçables manuellement.

La grille est donc un élément de visualisation du système de
construction, et non un éditeur de points.

18. Live Preview

Toute modification d'un paramètre doit recalculer immédiatement les cinq
glyphes.

Cible :

input → rendu visuel < 50 ms

Les sliders doivent rester fluides.

La compilation complète du fichier TTF ne doit pas être effectuée à
chaque frame. Elle est déclenchée lors de l'export.

19. Preview texte

L'interface affiche les cinq glyphes ensemble :

ABCDE

Elle peut également afficher des compositions utilisant exclusivement
les glyphes disponibles :

BAD
CAB
DAD
DECADE

Le preview doit utiliser les mêmes contours que ceux destinés à
l'export.

20. Export TTF

L'utilisateur dispose d'une action :

Export TTF

Le système :

convertit les cinq glyphes en contours compatibles OpenType ;

applique les métriques ;

mappe les glyphes aux Unicode correspondants ;

crée les tables nécessaires ;

génère le fichier ;

déclenche son téléchargement.

Mapping minimum :

A → U+0041
B → U+0042
C → U+0043
D → U+0044
E → U+0045

La font doit également contenir un glyphe .notdef.

Nom de fichier indicatif :

modular-type-{seed}.ttf

21. Métriques typographiques

Pour le MVP, utiliser des métriques globales simples.

Exemple :

unitsPerEm = 1000
ascender = 800
descender = -200

Chaque glyphe possède un advanceWidth calculé à partir de sa largeur
et d'un side bearing global.

Le MVP ne nécessite pas de kerning manuel.

L'espacement doit néanmoins être suffisamment cohérent pour que :

ABCDE

soit visuellement exploitable après installation de la font.

22. Géométrie

Le moteur de géométrie est responsable de :

générer les modules ;

générer les connexions ;

fusionner les formes ;

supprimer les intersections indésirables ;

produire des contours fermés ;

simplifier les contours ;

convertir les formes vers des courbes compatibles avec l'export.

Les contours exportés doivent être valides et ne pas dépendre de la
représentation SVG du navigateur.

23. Architecture technique cible

React Application
│
├── UI
│ ├── Controls
│ ├── GlyphSelector
│ ├── GlyphView
│ ├── FontPreview
│ └── ExportButton
│
├── FontProject
│ ├── seed
│ ├── DesignDNA
│ ├── FontStyle
│ └── glyphVariants
│
├── GlyphRecipes
│ ├── A
│ ├── B
│ ├── C
│ ├── D
│ └── E
│
├── GeometryEngine
│ ├── gridTransform
│ ├── modules
│ ├── connections
│ ├── booleanUnion
│ └── contourCleanup
│
├── Renderer
│ └── SVG
│
└── FontExporter
└── TTF

24. Technologies envisagées

Frontend

React

TypeScript

SVG

Vite ou Next.js

Font generation

Pour le MVP :

opentype.js

Le fichier TTF doit pouvoir être généré entièrement côté client.

Géométrie

Une bibliothèque de boolean operations peut être utilisée si nécessaire
pour les unions de formes et le nettoyage des contours.

Le choix exact doit être validé par un prototype technique avant
l'implémentation complète.

25. State management

Le projet actif doit pouvoir être représenté par un seul objet
sérialisable.

type ProjectState = {
version: 1
seed: number
selectedGlyph: "A" | "B" | "C" | "D" | "E"
dna: DesignDNA
style: FontStyle
glyphVariants: Record<string, number>
}

Aucun état essentiel à la reproduction de la font ne doit exister
uniquement dans le DOM ou dans le renderer.

26. Persistance

Pour le MVP, sauvegarder automatiquement le dernier projet dans
localStorage.

Au rechargement de la page :

restaurer le seed ;

restaurer les paramètres ;

restaurer les variantes ;

reconstruire exactement la font.

Aucun compte utilisateur n'est nécessaire.

27. Critères de qualité des générations

Une génération est considérée comme valide si :

les cinq caractères sont reconnaissables ;

aucun contour exporté n'est ouvert ;

aucune géométrie ne sort de manière incontrôlée de l'em square ;

les cinq caractères semblent appartenir au même système ;

aucune lettre n'est visuellement vide ;

le fichier TTF peut être installé et utilisé ;

le résultat dans la font installée correspond au preview web.

Le moteur peut rejeter automatiquement une génération qui viole des
contraintes géométriques simples.

28. Critère de variété

Le produit doit éviter le problème suivant :

toutes les générations ressemblent à la même font avec une épaisseur
ou une largeur différente.

La diversité doit provenir d'au moins quatre dimensions :

proportions

- modules
- connections
- topologies

Pour la validation MVP, générer manuellement un échantillon de 50
seeds.

L'équipe doit pouvoir identifier plusieurs familles visuelles clairement
distinctes dans cet échantillon.

29. Performance

Cibles desktop :

changement de slider perceptuellement instantané ;

Generate < 200 ms ;

changement de glyphe < 100 ms ;

export TTF < 2 s ;

aucune requête serveur nécessaire pour la génération.

Les opérations géométriques doivent être mises en cache lorsque cela est
pertinent.

30. Compatibilité

Navigateurs prioritaires :

Chrome desktop récent ;

Safari desktop récent ;

Firefox desktop récent.

Le MVP est desktop-first.

Le responsive mobile n'est pas une exigence de lancement.

31. User flow principal

Open app
↓
Default ABCDE
↓
Generate
↓
New design
↓
Adjust sliders
↓
Inspect A/B/C/D/E
↓
Preview words
↓
Export TTF
↓
Install/use font

L'utilisateur doit pouvoir atteindre l'export sans tutoriel obligatoire.

32. Acceptance Criteria

Le MVP est considéré comme terminé lorsque :

A, B, C, D et E sont définis sur une grille commune.

Chaque glyphe possède au moins deux variantes topologiques.

Les paramètres Width, Height, Module Size, Spacing, Roundness et
Contrast fonctionnent.

Circle, Square et Capsule sont disponibles.

Union et Bridge sont disponibles.

Les modifications sont visibles en temps réel.

Generate produit des variations déterministes à partir d'un
seed.

Les paramètres générés sont corrélés via un Design DNA.

Les cinq glyphes peuvent être inspectés individuellement.

Un preview multi-glyphes est disponible.

Le projet est restauré après refresh.

Export TTF génère un fichier .ttf.

Le TTF contient les mappings Unicode A--E.

Le TTF peut être installé sur macOS et/ou Windows.

Les caractères de la font installée correspondent visuellement
au preview.

50 seeds peuvent être générés sans erreur bloquante.

L'échantillon de 50 seeds produit plusieurs familles
visuellement distinctes.

33. Priorités d'implémentation

P0 --- Core

grille ;

cinq GlyphRecipes ;

renderer SVG ;

paramètres globaux ;

génération des contours ;

preview ABCDE ;

export TTF.

P1 --- Variation

deuxième topologie par glyphe ;

Design DNA ;

seed ;

Generate ;

validation des générations.

P2 --- Polish

previews de mots ;

persistance locale ;

transitions UI ;

amélioration du contour cleanup ;

naming de la font à partir du seed.

34. Risques techniques

Boolean geometry

Les unions entre modules peuvent produire des contours invalides ou
excessivement complexes.

Mitigation : prototyper le pipeline géométrique avant de développer
l'UI complète.

Cohérence entre SVG et TTF

Le preview SVG peut différer du résultat exporté si deux pipelines
géométriques différents sont utilisés.

Mitigation : utiliser une représentation géométrique canonique
unique dont dérivent à la fois SVG et OpenType.

Randomisation incohérente

Un random pur peut produire beaucoup de résultats inutilisables.

Mitigation : Design DNA corrélé + contraintes + rejet des
générations invalides.

Lisibilité

Certaines variations peuvent casser l'identité d'un glyphe.

Mitigation : limites spécifiques par glyphe et topologies préconçues
plutôt que génération structurelle totalement libre.

35. Principe produit

Le MVP ne doit pas être conçu comme un mini FontLab.

Il doit fonctionner comme un générateur de systèmes typographiques.

L'unité principale manipulée par l'utilisateur n'est donc pas le point
Bézier, mais la règle.

Traditional font editor:

point → contour → glyph → font

Modular Type:

rules → system → glyphs → font

Cette distinction doit guider les décisions produit et techniques du
MVP.
