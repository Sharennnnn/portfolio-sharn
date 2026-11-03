# Passation — Portfolio Shar'N

*Version publique allégée (le dépôt est public) : aucun chemin local, aucune adresse e-mail, aucun nom de client.
La version complète reste hors Git chez Charlie. Mise à jour : **3 novembre 2026**, troisième passe en cours sur la branche `passe-3`.
Étiquettes : (a) fait vérifié, (b) bonne pratique, (c) avis.*

---

## 1. Projet

Portfolio de Shar'N (infographiste, Namur), codé à la main pour remplacer Adobe Portfolio. Bilingue FR/EN, thème sombre,
accent `#e09a55`, grille 3:4, polices Inter / Anton / Instrument Serif (OFL). Tout le contenu se modifie dans l'admin
(Sveltia CMS → commit sur `main` → build Cloudflare Pages).

| Ressource | Valeur |
|---|---|
| Site | https://portfolio-sharn.pages.dev |
| Admin | `/admin/` (connexion GitHub, `auth_scope: public_repo`) |
| Aperçu d'une branche | `<branche>.portfolio-sharn.pages.dev` |
| Stack | Astro **~7.3.8**, CSS pur, Sveltia CMS 0.227.2 figé + SRI, sharp, three (chargé à la demande), js-yaml |
| Node | Cloudflare : `NODE_VERSION=22.12.0`. astro 7.4.x exige Node ≥ **22.23.4** (a, `npm view`, 3/11) |

## 2. Règles de travail

- Partir de l'état réel (`git pull`) : l'admin écrit en permanence sur `main`.
- Code sur une branche de session, jamais sur `main` ; pas de fusion ni de suppression sans accord de Charlie.
- Ne pas modifier `src/content/**` ni `public/admin/config.yml` depuis une branche de code (conflits avec l'admin) :
  donner le texte à coller.
- Avant de livrer : `npm run build` (contrôle CSP), `npm test`, HTML généré, puis vérification en ligne de l'aperçu.
- Sécurité, WCAG 2.1 AA et `prefers-reduced-motion` ne sont jamais affaiblis.
- Lire les `engines` avant toute mise à jour.

## 3. Troisième passe (3 novembre 2026)

### Phase A — état réel (a)
- 11 commits de l'admin depuis le 17/10 : check-runs Cloudflare Pages tous en **success**.
- Console sans erreur (accueil FR/EN, Projets, He Waits, About EN).
- 26 projets × FR/EN en 200 ; 20 redirections 301 correctes ; 404 FR/EN avec bon `lang` et `noindex` ;
  sitemap 60 adresses + 180 `hreflang`, toutes en 200 ; `robots.txt` correct.
- Les 12 fiches sans texte n'affichent aucune rubrique vide (FR et EN).
- PageSpeed Insights (interface web, une mesure par page) :

| Page | Mobile | Desktop |
|---|---|---|
| Accueil | 99 / 100 / 100 / 100 · LCP 2,0 s · CLS 0 | 100 ×4 · LCP 0,6 s |
| Projets | 99 / 100 / 100 / 100 · LCP 2,1 s · TBT 60 ms · CLS 0 | 100 ×4 · LCP 0,4 s |
| Creed | 100 ×4 · LCP 1,8 s · CLS 0 | 100 ×4 · LCP 0,3 s |

### Phase B — code et dépendances (branche `passe-3`)

| Commit | Changement | Vérification |
|---|---|---|
| `177e45e` | Affiche 3D : l'image revient si le contexte WebGL est perdu (avant : colonne vide) | Perte forcée sur l'aperçu : opacité 0 → 1, canvas retiré |
| `0480a63` | `rempli` (règle de masquage des rubriques) déplacé dans `utils.js` + `utils.test.js` | `npm test` 5/5 |
| `9978cb3` | Galeries : `srcset` 640 / 1200 px | Mobile 375 px ×2 : variante 1200 px chargée |
| `d223b45` | astro 7.3.2 → 7.3.8 (GHSA-mpr7-6m5w-76rw, faible, site non exposé) | `npm audit` 0, CSP 62 pages, Cloudflare success |

- Point connu : `undici@8.12.2` (via `unifont`) déclare Node ≥ 22.19 alors que Cloudflare est en 22.12. Déjà présent
  avant la passe, sans effet sur le build. Si un build échoue un jour : `NODE_VERSION=22.23.4`.
- Branches `phase-*` et `redesign` supprimées le 3/11 (toutes fusionnées) ; le prototype GSAP non fusionné est conservé
  dans le tag `archive/phase-c-f1`.
- Sécurité, point 5 (a, API GitHub) : un seul collaborateur (admin), 0 clé de déploiement, 0 webhook, 0 invitation.

### Phase C — design (branche `passe-3`, options 1 et 2 choisies par Charlie)

| Commit | Changement | Vérification |
|---|---|---|
| `fe240bf` | Couleur **moyenne** de chaque affiche (sharp, au build) en fond de case pendant le chargement : mur, cartes, affiche de la page projet. La « dominante » de sharp donnait du noir pour les affiches sombres | Images masquées sur l'aperçu : cases teintées au lieu de noires ; 28 fonds sur l'accueil |
| `ea1848d`, `4ba39ae` | Fiche de la page projet en « bloc de crédits » (Anton en capitales, rôles en Inter 0,55 em `#a1a1a7`, paires groupées) | `getComputedStyle` : Anton 20 px, rôles 11 px, contraste 7,7:1 |
| `6a369a7` | En-tête : fondu `--fond` au-dessus de l'îlot (le texte ne passe plus net entre l'îlot et le bord) | Mobile 375 px sur l'aperçu |

- Existant gardé : wordmark géant du pied de page (avis : le garder plutôt qu'une signature pinceau), transitions
  `@view-transition` (déjà en place).
- PageSpeed de l'aperçu : 99–100 en performance ; SEO 69 uniquement parce que Cloudflare ajoute `X-Robots-Tag: noindex`
  aux aperçus. CLS desktop 0,01–0,014 mesuré **aussi en production** : variation déjà présente, pas une régression.
- Non retenu : options 3 (retirer boutons magnétiques et inclinaison des vignettes) et 4 (moins de surtitres et de « → »).

### Phase D — accessibilité (WCAG 2.1 AA)

- axe-core 4.10.3 (`wcag2a/aa`, `wcag21a/aa`, `best-practice`) sur une copie locale du build **sans CSP** (équivalent
  `bypassCSP`) : **0 violation** sur 14 pages FR/EN, avant et après correctifs.
- Contrastes recalculés (`getComputedStyle`, formule WCAG) : minimum 7,70:1 hors en-tête.
- Clavier : ordre logique, focus orange 2 px partout, filtres et Index (`aria-pressed`, statut annoncé), visionneuse
  (modale, Échap, focus rendu). Pause 2.2.2 OK. Reflow 320 px OK (9 pages). Un `h1` et bon `lang` sur 62 pages.

| Commit | Correctif | Vérification |
|---|---|---|
| `64332fc` | Îlot de l'en-tête opaque à 88 % (avant 72 %) : liens `--texte-doux` à 2,86:1 sous une affiche claire → ≥ 5,10:1 | `backgroundColor` alpha 0.88 sur l'aperçu |
| `ce652e6` | Image des cartes en `alt=""` (le titre nomme déjà le lien) | 0 `alt` non vide sur les cartes de l'aperçu |

- Non testable ici : NVDA, VoiceOver, Safari, Firefox réels, simulation de « réduire les animations » (vérifié dans le
  code uniquement). Liste de vérifications donnée à Charlie (dont le réglage Firefox qui coupe les lecteurs d'écran).

### Phase E — contenu

- Confirmé par Charlie : Creed et Laylow publiés sur Instagram ; les deux personnes du Parcours d'accord pour être
  citées ; travaux **non rémunérés** → libellé « Client freelance » à remplacer dans l'admin (options proposées).
- `7488bca` : colonne C de l'accueil resserrée (`ui.js`, même contenu). Bio (« deux registres » → trois) et chapeau
  « cinéma » proposés à coller dans l'admin. Les 12 fiches et les 4 « Mes choix » sont **reportés** par Charlie.

### Phase F — sécurité (re-vérification du 3/11)

| # | Point | Statut | Preuve |
|---|---|---|---|
| 1 | Clés côté serveur | ✅ | Code du Worker : secrets lus dans `env` uniquement |
| 2 | `.env` ignoré | ✅ | `.gitignore` ; 0 `.env` dans l'historique |
| 3 | Secrets dans l'historique | ✅ | Script de motifs (GitHub, AWS, clés privées, Google, Slack, Stripe, JWT, affectations à forte entropie) sur 166 commits / 420 versions de fichiers : 0 ; motifs testés sur de faux secrets. gitleaks non installé |
| 4 | Jeton limité | ✅ | `auth_scope: public_repo` ; Worker → `scope=public_repo` (redirection testée) |
| 5 | Droits d'écriture | ✅ | API GitHub : 1 collaborateur (admin), 0 clé de déploiement, 0 webhook, 0 invitation |
| 6, 9, 11, 12, 14 | RLS, formulaires, SQL, mots de passe, paiements | ➖ | Site statique |
| 7 | Admin protégée | ✅ | OAuth GitHub ; `noindex, nofollow` ; `Disallow: /admin/` |
| 8 | Worker | ✅ (+ amélioration) | Code relu ; en ligne : domaine étranger, suffixe et préfixe piégés → `UNSUPPORTED_DOMAIN` ; faux cookie → `CSRF_DETECTED`. Scope inconnu → retombe sur `repo,user` (défaut du code) : passer le défaut à `public_repo` |
| 10 | Échappement | ✅ | Seul `set:html` = JSON-LD avec `<` échappé |
| 13 | Limitation de débit | ➖ | Doc Cloudflare : règles WAF par **zone** (domaine perso requis) ; liaison `ratelimit` possible dans le Worker |
| 15 | En-têtes + CSP | ✅ | `curl -I` en ligne ; YouTube, fumée, affiche 3D et admin sans violation CSP ni erreur console |
| 16 | Sourcemaps | ✅ | 0 `.map`, 0 `sourceMappingURL` |
| 17 | Adresses sensibles | ✅ | 15 chemins en 404 ; `admin/config.yml` public (sans secret) |
| 18 | Dépendances | ✅ | `npm audit` 0 après astro 7.3.8 ; SRI Sveltia recalculé (unpkg = npm) |
| 19 | SVG | ✅ (côté build) | `34ceac4` : tout fichier non image dans `public/images/projets` fait échouer le build (testé avec un SVG à `<script>`) ; CSP `sandbox` sur `/images/*`. Test réel dans l'admin à faire par Charlie |
| 20 | 2FA | ⏳ déclaré, non vérifié | À confirmer par Charlie |

- Dépôt public : aucun document, coordonnée ni capture personnelle dans l'historique (captures ouvertes : visuels de
  travail). Adresse **personnelle** de Charlie visible comme auteur de 113 commits ; 15 commits de cette session signés
  avec le nom de la machine (identité locale corrigée vers l'adresse `noreply` GitHub après coup). Images de l'ancienne
  fiche Six O'Clock toujours dans `public/` et l'historique.

## 4. Reste à faire (côté Charlie)

- Médias de l'admin : supprimer les images de l'ancienne fiche Six O'Clock (`khali_sixoclock*`, toujours accessibles
  par leur adresse) et `pasted-image-1789067949822.png` (inutilisée).
- 12 fiches sans texte ; rubriques « Mes choix » vides (Bijoux de Fafi, Urban Jersey, The Age of Kings, Thomas Shelby).
- He Waits : faute « Photohop » dans *Outils*.
- CV `public/cv-sharn.pdf` absent ; couvertures 282 × 400 à vérifier.
- 2FA (GitHub, Cloudflare, compte de l'adresse de contact) : déclaré, non vérifié.
- Test réel d'un envoi SVG dans l'admin ; test avec un vrai lecteur d'écran.
- Domaine personnalisé : `site` dans `astro.config.mjs`, `ALLOWED_DOMAINS` du Worker, limitation de débit.
- Fusion de `passe-3` dans `main` : sur accord.
