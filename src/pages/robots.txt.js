export function GET({ site }) {
  const texte = `User-agent: *\nDisallow: /admin/\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`;
  return new Response(texte, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
