// Vérification après build : chaque <script> exécutable de chaque page doit avoir son empreinte
// dans la CSP de la page, sinon le navigateur le bloquerait sans bruit.
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

export async function verifierCsp(racine) {
  const pages = (await readdir(racine, { recursive: true })).filter((f) => f.endsWith('.html') && !f.startsWith('admin'));
  const erreurs = [];
  for (const f of pages) {
    const html = await readFile(path.join(racine, f), 'utf8');
    const csp = html.match(/http-equiv="content-security-policy" content="([^"]*)"/)?.[1] ?? '';
    for (const [, attrs, code] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/type="application\/ld\+json"/.test(attrs) || /\ssrc=/.test(attrs)) continue;
      const empreinte = `sha256-${createHash('sha256').update(code).digest('base64')}`;
      if (!csp.includes(empreinte)) erreurs.push(`${f} : script sans empreinte CSP (${code.slice(0, 40)}…)`);
    }
  }
  if (erreurs.length) throw new Error(`CSP incomplète :\n${erreurs.join('\n')}`);
  return pages.length;
}
