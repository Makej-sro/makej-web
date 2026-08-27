#!/usr/bin/env python3
"""Lokální server, který se chová jako Netlify.

Vestavěný `python3 -m http.server` neumí adresy bez .html — po sjednocení odkazů
by na localhostu všechna navigace házela 404, i když živě funguje. Tenhle server
dělá totéž co Netlify: /lide obslouží z lide.html a /lide.html trvale přesměruje
na /lide, aby existovala jedna adresa jedné stránky.

Spuštění:  python3 dev-server.py       (výchozí port 3333)
"""
import http.server, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3333

class Handler(http.server.SimpleHTTPRequestHandler):
    def _prepis(self):
        cesta = self.path.split('?')[0].split('#')[0]
        # /neco.html → 301 na /neco   (a /index.html → /)
        if cesta.endswith('.html'):
            cil = '/' if cesta == '/index.html' else cesta[:-5]
            self.send_response(301)
            self.send_header('Location', cil + self.path[len(cesta):])
            self.end_headers()
            return True                      # hotovo, dál se nepokračuje
        # /neco → soubor neco.html, pokud existuje
        if cesta not in ('/', '') and not os.path.exists(cesta.lstrip('/')):
            if os.path.exists(cesta.lstrip('/') + '.html'):
                self.path = cesta + '.html' + self.path[len(cesta):]
        return False

    def do_GET(self):
        if not self._prepis(): super().do_GET()

    def do_HEAD(self):
        if not self._prepis(): super().do_HEAD()

    def log_message(self, *a):
        pass

if __name__ == '__main__':
    print(f'Makej dev server → http://localhost:{PORT}  (Ctrl+C ukončí)')
    http.server.ThreadingHTTPServer(('', PORT), Handler).serve_forever()
