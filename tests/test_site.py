import hashlib
import os
import re
import unittest

SITE = os.path.join(os.path.dirname(__file__), "..", "site")


def app_version():
    with open(os.path.join(SITE, "app.js"), encoding="utf-8") as f:
        src = f.read().replace("\r\n", "\n")
    return hashlib.sha256(src.encode("utf-8")).hexdigest()[:10]


class SiteTest(unittest.TestCase):
    def test_versao_do_app_js_no_html(self):
        # O Pages guarda arquivos por 10 min; a versão no endereço do script evita HTML novo com app.js antigo
        with open(os.path.join(SITE, "index.html"), encoding="utf-8") as f:
            html = f.read()
        m = re.search(r'<script src="app\.js\?v=([0-9a-f]+)"></script>', html)
        self.assertIsNotNone(m, "index.html deve carregar app.js?v=<versão>")
        self.assertEqual(m.group(1), app_version(),
                         "app.js mudou: atualize o ?v= do index.html para " + app_version())


if __name__ == "__main__":
    unittest.main()
