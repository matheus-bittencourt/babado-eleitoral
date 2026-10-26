import copy
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from check_data import check  # noqa: E402

DATA = os.path.join(os.path.dirname(__file__), "..", "site", "data.json")


class CheckDataTest(unittest.TestCase):
    def setUp(self):
        with open(DATA, encoding="utf-8") as f:
            self.data = json.load(f)

    def test_arquivo_publicado_e_valido(self):
        self.assertEqual(check(self.data), [])

    def test_recusa_link_sem_https(self):
        d = copy.deepcopy(self.data)
        d["news"][0]["u"] = "http://exemplo.com/noticia"
        self.assertTrue(any("news[0].u" in e for e in check(d)))

    def test_recusa_html_no_texto(self):
        d = copy.deepcopy(self.data)
        d["news"][0]["r"] = "<script>alert(1)</script>"
        self.assertTrue(any("news[0].r" in e for e in check(d)))

    def test_recusa_grupo_desconhecido(self):
        d = copy.deepcopy(self.data)
        d["news"][0]["g"] = "Fofoca"
        self.assertTrue(any("news[0].g" in e for e in check(d)))

    def test_recusa_manchete_repetida(self):
        d = copy.deepcopy(self.data)
        d["news"].append(copy.deepcopy(d["news"][0]))
        self.assertTrue(any("repetida" in e for e in check(d)))

    def test_recusa_mais_de_40_noticias(self):
        d = copy.deepcopy(self.data)
        base = d["news"][0]
        d["news"] = [dict(base, h=f"Manchete {i}") for i in range(41)]
        self.assertTrue(any("máximo" in e for e in check(d)))

    def test_recusa_status_invalido(self):
        d = copy.deepcopy(self.data)
        d["exits"][0]["st"] = "talvez"
        self.assertTrue(any("exits[0].st" in e for e in check(d)))


if __name__ == "__main__":
    unittest.main()
