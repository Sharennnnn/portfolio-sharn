// Données structurées schema.org (lues par Google), construites depuis les réglages de l'admin.
export function personne(reglages, metier, site) {
  const c = reglages.contact;
  return {
    '@type': 'Person',
    name: 'Charlie Renneson',
    alternateName: "Shar'N",
    jobTitle: metier,
    url: new URL('/', site).href,
    email: `mailto:${c.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Namur', addressCountry: 'BE' },
    sameAs: [c.instagram, c.linkedin].filter(Boolean),
  };
}

// Nom du site pour Google (« site name ») : sans cela, Google affiche le nom de l'hébergeur.
// Le nom préféré est le nom complet ; le pseudo et l'adresse du site sont les solutions de repli.
export function siteWeb(site) {
  const url = new URL('/', site);
  return {
    '@type': 'WebSite',
    name: 'Charlie Renneson',
    alternateName: ["Shar'N", url.hostname],
    url: url.href,
  };
}
