"""Barra a publicação se o repositório tiver segredo, dado pessoal ou arquivo fora da lista.

Uso: python check_privacy.py
Lê os arquivos versionados (git ls-files). Sai com código 1 e lista os problemas.
Roda no workflow antes do deploy, porque a tarefa agendada faz push sem revisão humana.
"""
import re
import subprocess
import sys

# Arquivos que o repositório pode ter. Qualquer outro barra a publicação.
ALLOWED = {
    ".gitignore", "CLAUDE.md", "README.md", "check_data.py", "check_privacy.py",
    ".github/workflows/publicar.yml",
    "site/index.html", "site/app.js", "site/data.json", "site/data-lula.json",
    "tests/test_check_data.py", "tests/test_check_privacy.py", "tests/test_site.py",
}

PATTERNS = {
    "chave Anthropic": r"sk-ant-[A-Za-z0-9_\-]{20,}",
    "token GitHub": r"\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})",
    "chave AWS": r"\bAKIA[0-9A-Z]{16}\b",
    "chave Google": r"\bAIza[0-9A-Za-z_\-]{35}\b",
    "chave privada": r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
    "senha ou segredo atribuído": r"(?i)\b(?:password|passwd|senha|secret|api[_-]?key|access[_-]?token)\b\s*[:=]\s*['\"][^'\"\s]{6,}['\"]",
    "e-mail": r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}",
    "caminho de pasta pessoal": r"(?i)(?:[A-Z]:[\\/]+Users[\\/]+\w|/c/Users/\w|/Users/\w|/home/\w)",
    "CPF": r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b",
    "telefone celular": r"\(?\b\d{2}\)?\s?9\d{4}-?\d{4}\b",
}
# E-mails que podem aparecer: o do Claude na autoria e os noreply do GitHub.
EMAIL_OK = re.compile(r"(?i)^(noreply@anthropic\.com|[\w.+\-]*@users\.noreply\.github\.com)$")


def scan_text(path, text):
    problems = []
    for n, line in enumerate(text.splitlines(), 1):
        # Nos próprios verificadores e testes, os padrões são o código
        if path in ("check_privacy.py", "tests/test_check_privacy.py"):
            continue
        for name, pat in PATTERNS.items():
            for m in re.finditer(pat, line):
                if name == "e-mail" and EMAIL_OK.match(m.group(0)):
                    continue
                problems.append(f"{path}:{n}: {name}")
    return problems


def tracked_files():
    out = subprocess.run(["git", "ls-files"], capture_output=True, text=True, check=True).stdout
    return [f for f in out.splitlines() if f]


def main():
    problems = []
    for path in tracked_files():
        if path not in ALLOWED:
            problems.append(f"{path}: arquivo fora da lista permitida")
            continue
        with open(path, encoding="utf-8", errors="replace") as f:
            problems += scan_text(path, f.read())
    for p in problems:
        print(p)
    if problems:
        return 1
    print("privacidade: ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
