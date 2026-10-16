import { getCollection } from 'astro:content';
import { chemins } from '../i18n/ui.js';
import { urlProjet } from '../i18n/utils.js';

// Chaque page FR et sa version EN, avec les liens hreflang croisés attendus par Google.
export async function GET({ site }) {
  const paires = Object.keys(chemins.fr).map((nom) => [chemins.fr[nom], chemins.en[nom]]);
  for (const p of await getCollection('projets')) paires.push([urlProjet('fr', p.id), urlProjet('en', p.id)]);

  const abs = (chemin) => new URL(chemin, site).href;
  const url = (chemin, [fr, en]) => `  <url>
    <loc>${abs(chemin)}</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="${abs(fr)}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${abs(en)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(fr)}"/>
  </url>`;
  const corps = paires.flatMap((paire) => paire.map((chemin) => url(chemin, paire))).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${corps}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
