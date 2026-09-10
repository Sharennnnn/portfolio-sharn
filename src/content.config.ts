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
    survol: z.string().optional(),
    galerie: z.array(z.string()).default([]),
    video: z.string().optional(),

    contrainte: z.string(),
    contrainte_en: z.string(),
    resolution: z.string(),
    resolution_en: z.string(),

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
      cle: z.enum(['selection', 'duo', 'cta']),
      visible: z.boolean().default(true),
    })),
    apropos: z.object({
      bio: z.array(z.string()),
      bio_en: z.array(z.string()),
      parcours: z.array(z.object({
        periode: z.string(),
        titre: z.string(), titre_en: z.string().optional(),
        lieu: z.string(), lieu_en: z.string().optional(),
      })),
      competences: z.array(z.object({
        groupe: z.string(), groupe_en: z.string().optional(),
        outils: z.string(),
      })),
    }),
    contact: z.object({
      email: z.string(),
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
    }),
    theme: z.object({
      accent: z.string().default('#e09a55'),
    }),
  }),
});

export const collections = { projets, reglages };
