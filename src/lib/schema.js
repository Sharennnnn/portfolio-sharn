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
