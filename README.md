# Portfolio Shar'N

Site statique Astro, bilingue FR/EN, déployé sur Cloudflare Pages.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # génère dist/
```

## ⚠️ À FAIRE AVANT LE PREMIER LANCEMENT

### 1. Exporter les images depuis Figma

Le code attend ces quatre fichiers dans `public/images/projets/` :

| Fichier attendu | Calque Figma |
|---|---|
| `creed.jpg` | Creed 1 |
| `uhz1.jpg` | Mockup_3_LOGO_SI2026 1 |
| `ciao-kombucha.jpg` | RENCH_CV_SA01_Collab 1 |
| `laylow-ambre.jpg` | Laylow_Ambre gothique 1 |

**Comment exporter :** dans Figma, sélectionne le calque image → panneau Export
(en bas à droite) → format JPG, échelle 2x → Export.

**Optimisation avant mise en ligne :** vise 900 × 1200 px et moins de 300 Ko par
image. Une affiche exportée en 300 dpi pèse souvent 15 à 40 Mo, ce qui est
inutilisable sur le web. Utilise Squoosh (squoosh.app) ou l'export « Enregistrer
pour le web » de Photoshop.

### 2. Remplir les textes

Les quatre fichiers de `src/content/projets/` contiennent des champs marqués
`À COMPLÉTER`. Ce sont les deux champs qui comptent pour un recruteur :

- `contrainte` : le problème posé (format, support, budget, exercice imposé)
- `resolution` : ta décision de conception et son pourquoi

Chaque champ existe en FR et en EN (suffixe `_en`).

### 3. Configurer l'administration

Dans `public/admin/config.yml`, remplace `TON-PSEUDO` par ton pseudo GitHub.
L'interface sera accessible sur `/admin` — connexion par ton compte GitHub.

### 4. Remplacer les adresses

- Email : `src/pages/contact.astro` et `src/pages/en/contact.astro`
- Instagram et LinkedIn : mêmes fichiers + `src/components/Footer.astro`
- CV : dépose `cv-sharn.pdf` dans `public/`

## Ajouter un projet

Deux méthodes, au choix.

**Via l'interface `/admin`** — formulaire, aucun code à toucher.

**En créant un fichier** dans `src/content/projets/mon-projet.md` :

```yaml
---
titre: Nom du projet
titre_en: Project name
annee: 2026
origine: client        # client | fanart | exercice | perso
disciplines: [print]   # print | identite | animation
couverture: /images/projets/mon-projet.jpg
contrainte: Le problème posé.
contrainte_en: The problem.
resolution: Ce que tu as fait.
resolution_en: What you did.
phare: false           # true = page dédiée
ordre: 50              # plus petit = plus haut dans la grille
---
```

Le nom du fichier devient l'URL : `mon-projet.md` → `/projets/mon-projet`.

## Structure

```
src/
  content/projets/     un fichier .md par projet (FR + EN)
  components/          Header, Footer, CarteProjet, Filtres
  layouts/Base.astro   structure HTML, SEO, script d'animation
  i18n/ui.js           tous les textes d'interface FR et EN
  pages/               FR à la racine, EN sous /en/
  styles/global.css    tokens, typographie, animations
public/
  admin/               interface Sveltia CMS
  images/projets/      tes visuels
```

## Déploiement Cloudflare Pages

| Champ | Valeur |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Variable `NODE_VERSION` | `22.12.0` |

Sans la variable `NODE_VERSION`, le build échoue avec un message peu explicite.

## Animations

Les amplitudes et la courbe viennent de la maquette Figma. Figma joue une
timeline de 3 s au chargement ; sur le web, le déclencheur est le défilement
(`IntersectionObserver`), sauf pour le hero qui s'anime au chargement.

| Élément | Déplacement | Classe |
|---|---|---|
| Header | 14 px | `.reveal--header` |
| Eyebrow, chapeau | 32 px | `.reveal--eyebrow` |
| Titre H1 | 46 px | `.reveal--titre` |
| Vignettes | 40 px + échelle 0,96 → 1 | `.reveal--carte` |
| Blocs de section | 28 px | `.reveal--bloc` |
| CTA | 24 px | `.reveal--cta` |

Tout est désactivé si le système du visiteur demande une réduction de mouvement
(`prefers-reduced-motion`), conformément aux règles WCAG.

## Palette

Contrastes mesurés sur le fond `#0a0a0b` (formule WCAG 2.1) :

| Token | Valeur | Ratio |
|---|---|---|
| `--texte` | `#ededed` | 16.9:1 — AAA |
| `--texte-doux` | `#8a8a90` | 5.77:1 — AA |
| `--accent` | `#e09a55` | 8.41:1 — AAA |

L'accent est une version éclaircie de l'orange de ta bannière (`#ce8a4b`, qui
plafonnait à 6.94:1 et n'atteignait pas le seuil AAA de 7:1).
