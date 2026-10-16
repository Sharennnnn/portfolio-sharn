# Portfolio Shar'N

Site statique Astro, bilingue FR/EN, déployé sur Cloudflare Pages.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # génère dist/
```

## Modifier le contenu

Tout se fait depuis `/admin` (connexion GitHub) : projets, textes de l'accueil,
bio, contact, couleur d'accent, bannière, ordre et visibilité des sections.
Chaque enregistrement crée un commit et Cloudflare redéploie le site.

- Les images envoyées par l'admin sont converties en WebP (1600 px max) et
  renommées sans accents ; au-delà de 2 Mo après conversion, l'envoi est refusé.
- Le bouton CV de la page À propos n'apparaît que si `public/cv-sharn.pdf` existe.

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
couverture: /images/projets/mon-projet-couverture.webp
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
  content/reglages/    site.yaml : réglages modifiables depuis l'admin
  components/          Header, Footer, CarteProjet, Filtres
  layouts/Base.astro   structure HTML, SEO, couleur d'accent, script d'animation
  i18n/                textes d'interface FR/EN (ui.js) et fonctions de langue
  vues/                une vue par page, partagée par le FR et l'EN
  pages/               FR à la racine, EN sous /en/ ; chaque page appelle sa vue
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

## Sécurité

- En-têtes (HSTS, anti-clickjacking, Permissions-Policy…) : `public/_headers`.
- CSP : générée par Astro (`security.csp` dans `astro.config.mjs`) ; le build échoue
  si un script de page n'a pas son empreinte (`src/lib/verifier-csp.js`).
- L'admin charge une **version figée** de Sveltia CMS avec une empreinte SRI
  (`public/admin/index.html`). Pour la mettre à jour, choisis une version publiée
  depuis au moins deux semaines, puis recalcule l'empreinte :

  ```bash
  npm pack @sveltia/cms@X.Y.Z && tar xzf sveltia-cms-X.Y.Z.tgz
  echo "sha384-$(openssl dgst -sha384 -binary package/dist/sveltia-cms.js | openssl base64 -A)"
  ```
