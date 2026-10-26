import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from check_privacy import scan_text  # noqa: E402


class CheckPrivacyTest(unittest.TestCase):
    def test_texto_limpo_passa(self):
        self.assertEqual(scan_text("site/data.json", '{"h": "Lula é reeleito com 51,79%"}'), [])

    def test_noreply_passa(self):
        self.assertEqual(scan_text("README.md", "Autor: 123+fulano@users.noreply.github.com"), [])

    def test_barra_email_pessoal(self):
        self.assertTrue(scan_text("site/data.json", "contato: fulano.silva@gmail.com"))

    def test_barra_chave_anthropic(self):
        self.assertTrue(scan_text("site/app.js", 'const k = "sk-ant-api03-' + "a" * 30 + '"'))

    def test_barra_token_github(self):
        self.assertTrue(scan_text("CLAUDE.md", "gho_" + "A1b2" * 9))

    def test_barra_caminho_pessoal(self):
        self.assertTrue(scan_text("CLAUDE.md", r"Repositório em C:\Users\fulano\Downloads"))

    def test_barra_cpf_e_telefone(self):
        self.assertTrue(scan_text("site/data.json", "CPF 123.456.789-09"))
        self.assertTrue(scan_text("site/data.json", "ligue (11) 91234-5678"))


if __name__ == "__main__":
    unittest.main()
