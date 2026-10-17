# Génère les cartes de partage par défaut à partir de scripts/carte-partage.html (Playwright + Chromium).
# Usage, depuis la racine du dépôt : python3 scripts/carte-partage.py [fr|en ...]   (par défaut : en)
import pathlib, sys
from playwright.sync_api import sync_playwright

racine = pathlib.Path(__file__).resolve().parent.parent
modele = (racine / 'scripts' / 'carte-partage.html').as_uri()
sorties = {'fr': 'og-default.png', 'en': 'og-default-en.png'}

with sync_playwright() as p:
    navigateur = p.chromium.launch()
    page = navigateur.new_page(viewport={'width': 1200, 'height': 630})
    for langue in sys.argv[1:] or ['en']:
        page.goto(f'{modele}?l={langue}')
        page.evaluate('document.fonts.ready')
        page.screenshot(path=str(racine / 'public' / sorties[langue]))
        print('écrit', sorties[langue])
    navigateur.close()
