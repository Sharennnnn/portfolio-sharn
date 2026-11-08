import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const projets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projets' }),
  schema: z.object({
    titre: z.string(),
    titre_en: z.string(),
    annee: z.number(),
    origine: z.enum(['client', 'fanart', 'exercice', 'perso']),
    disciplines: z.array(z.enum(['print', 'identite', 'animation'])),
    client: z.string().optional(),

    couverture: z.string(),
    // Description de l'affiche pour les lecteurs d'écran ; vide : le titre du projet sert de texte alternatif.
    couverture_alt: z.string().nullish(),
    couverture_alt_en: z.string().nullish(),
    survol: z.string().optional(),
    galerie: z.array(z.string()).default([]),
    video: z.string().optional(),

    contrainte: z.string(),
    contrainte_en: z.string(),
    resolution: z.string(),
    resolution_en: z.string(),
    resultat: z.string().optional(),
    resultat_en: z.string().optional(),

    livrables: z.string().optional(),
    livrables_en: z.string().optional(),
    outils: z.array(z.string()).default([]),

    phare: z.boolean().default(false),
    ordre: z.number().default(50),
  }),
});

import { load as yamlLoad } from 'js-yaml';

const reglages = defineCollection({
  loader: file('./src/content/reglages/site.yaml', {
    parser: (texte) => ({ site: yamlLoad(texte) }),
  }),
  schema: z.object({
    hero: z.object({
      eyebrow: z.string(), eyebrow_en: z.string(),
      titre1: z.string(), titre1_en: z.string(),
      titre2: z.string(), titre2_en: z.string(),
      titre3: z.string(), titre3_en: z.string(),
      chapeau: z.string(), chapeau_en: z.string(),
      cta_titre: z.string(), cta_titre_en: z.string(),
      cta_texte: z.string(), cta_texte_en: z.string(),
      cta_bouton: z.string(), cta_bouton_en: z.string(),
    }),
    banniere: z.object({
      visible: z.boolean().default(false),
      image: z.string().optional(),
      lien: z.string().optional(),
    }),
    sections: z.array(z.object({
      cle: z.enum(['selection', 'duo', 'services', 'outils', 'parcours', 'cta']),
      visible: z.boolean().default(true),
    })),
    // Listes vides : la rubrique correspondante de l'accueil n'est pas affichée.
    // L'admin écrit null quand on vide une liste ou un bloc entier : accepté partout, lu comme « vide ».
    services: z.array(z.object({
      titre: z.string(), titre_en: z.string().nullish(),
      texte: z.string(), texte_en: z.string().nullish(),
      etiquettes: z.string().nullish(), etiquettes_en: z.string().nullish(),
    })).nullish().transform((v) => v ?? []),
    boite_outils: z.array(z.object({
      groupe: z.string(), groupe_en: z.string().nullish(),
      outils: z.array(z.string().nullish()).nullish().transform((v) => (v ?? []).filter(Boolean)),
    })).nullish().transform((v) => v ?? []),
    // Titres des rubriques de l'accueil ; un champ vide garde le titre par défaut de src/i18n/ui.js.
    rubriques: z.record(z.enum(['services', 'outils', 'parcours']), z.object({
      surtitre: z.string().nullish(), surtitre_en: z.string().nullish(),
      titre: z.string().nullish(), titre_en: z.string().nullish(),
      chute: z.string().nullish(), chute_en: z.string().nullish(),
    }).nullish()).nullish().transform((v) => v ?? {}),
    apropos: z.object({
      photo: z.string().optional(),
      bio: z.array(z.string()),
      bio_en: z.array(z.string()),
      parcours: z.array(z.object({
        periode: z.string(),
        titre: z.string(), titre_en: z.string().optional(),
        lieu: z.string(), lieu_en: z.string().optional(),
      })),
    }),
    contact: z.object({
      email: z.string(),
      // Liens publiés tels quels dans des href : adresse https:// ou champ vide, rien d'autre.
      instagram: z.string().regex(/^(https:\/\/\S+)?$/).optional(),
      linkedin: z.string().regex(/^(https:\/\/\S+)?$/).optional(),
    }),
    theme: z.object({
      // Injectée dans un attribut style : on n'accepte qu'une couleur hexadécimale.
      accent: z.string().regex(/^#[0-9a-fA-F]{3,8}$/).default('#e09a55'),
    }),
  }),
});

export const collections = { projets, reglages };
