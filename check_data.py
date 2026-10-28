"""Valida site/data.json antes de publicar. Só biblioteca padrão.

Uso: python check_data.py [caminho ...]   (padrão: site/data.json site/data-lula.json)
Arquivos com "lula" no nome são o lado Lula: só "news", com o grupo "Lula e governo".
Sai com código 1 e lista os problemas se algo estiver fora do formato.
"""
import json
import re
import sys
from datetime import date, datetime, timedelta, timezone

COMMON = {"Música", "TV e cinema", "Esporte", "Influenciadores", "Religiosos"}
GROUPS = {"flavio": COMMON | {"Flávio e campanha"}, "lula": COMMON | {"Lula e governo"}}
STATUS = {"yes", "no", "unk"}
MONTHS = {"jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"}
MAX_NEWS = 40
BRT = timedelta(hours=-3)


def text(v):
    return isinstance(v, str) and v.strip() != "" and "<" not in v and ">" not in v


def url(v):
    return isinstance(v, str) and re.match(r"^https://[^\s<>\"]+$", v) is not None


def sources(v):
    return isinstance(v, list) and len(v) > 0 and all(
        isinstance(s, list) and len(s) == 2 and text(s[0]) and url(s[1]) for s in v
    )


def check(data, side="flavio"):
    errors = []
    if not isinstance(data, dict):
        return ["o arquivo deve ser um objeto JSON"]

    try:
        up = datetime.fromisoformat(data.get("updated", ""))
        if up.utcoffset() != BRT:
            errors.append("updated: use o horário de Brasília (-03:00)")
        elif up > datetime.now(timezone.utc) + timedelta(minutes=15):
            errors.append("updated: hora no futuro (provavelmente UTC gravado como -03:00)")
        elif data.get("updated_label") != f"{up:%d/%m/%Y}, {up.hour}h":
            errors.append(f"updated_label: deveria ser {up:%d/%m/%Y}, {up.hour}h")
    except (TypeError, ValueError):
        errors.append("updated: data e hora ISO inválida")
    if not text(data.get("updated_label")):
        errors.append("updated_label: vazio")

    # O placar e o destaque "Malas prontas?" ficam só no data.json; o lado Lula tem só notícias
    r = data.get("result")
    if side == "lula":
        pass
    elif not isinstance(r, dict):
        errors.append("result: ausente")
    else:
        for k in ("lula", "flavio"):
            if not isinstance(r.get(k), (int, float)) or not 0 < r[k] < 100:
                errors.append(f"result.{k}: percentual inválido")
        for k in ("fact", "r"):
            if not text(r.get(k)):
                errors.append(f"result.{k}: vazio ou com < >")
        if not sources(r.get("s")):
            errors.append("result.s: fontes inválidas")

    exits = data.get("exits") if side == "flavio" else []
    if side == "flavio" and (not isinstance(exits, list) or not exits):
        errors.append("exits: lista vazia")
        exits = []
    for i, x in enumerate(exits):
        where = f"exits[{i}]"
        for k in ("n", "role", "stl", "p", "r"):
            if not text(x.get(k)):
                errors.append(f"{where}.{k}: vazio ou com < >")
        if x.get("st") not in STATUS:
            errors.append(f"{where}.st: use yes, no ou unk")
        if "q" in x and not text(x["q"]):
            errors.append(f"{where}.q: vazio ou com < >")
        if not sources(x.get("s")):
            errors.append(f"{where}.s: fontes inválidas")

    news = data.get("news")
    if not isinstance(news, list) or not news:
        errors.append("news: lista vazia")
        news = []
    if len(news) > MAX_NEWS:
        errors.append(f"news: {len(news)} itens, o máximo é {MAX_NEWS}")
    seen = set()
    for i, n in enumerate(news):
        where = f"news[{i}]"
        try:
            d = date.fromisoformat(n.get("d", ""))
            if d > date.today():
                errors.append(f"{where}.d: data no futuro")
        except (TypeError, ValueError):
            errors.append(f"{where}.d: data ISO inválida")
        if n.get("g") not in GROUPS[side]:
            errors.append(f"{where}.g: grupo desconhecido")
        if not isinstance(n.get("who"), list) or not n["who"] or not all(text(w) for w in n["who"]):
            errors.append(f"{where}.who: lista de nomes inválida")
        for k in ("h", "src"):
            if not text(n.get(k)):
                errors.append(f"{where}.{k}: vazio ou com < >")
        if "p" in n and n["p"] != "" and not text(n["p"]):
            errors.append(f"{where}.p: com < >")
        if not text(n.get("r")):
            errors.append(f"{where}.r: toda nota precisa de pitaco (sem < >)")
        if not url(n.get("u")):
            errors.append(f"{where}.u: link precisa ser https")
        if "dm" in n and n["dm"] not in MONTHS:
            errors.append(f"{where}.dm: mês inválido")
        if "check" in n and not isinstance(n["check"], bool):
            errors.append(f"{where}.check: use true ou false")
        key = (n.get("h"), n.get("u"))
        if key in seen:
            errors.append(f"{where}: manchete repetida")
        seen.add(key)
    return errors


def main(argv):
    paths = argv[1:] or ["site/data.json", "site/data-lula.json"]
    failed = False
    for path in paths:
        side = "lula" if "lula" in path.replace("\\", "/").rsplit("/", 1)[-1] else "flavio"
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, ValueError) as e:
            print(f"{path}: não deu para ler o JSON ({e})")
            failed = True
            continue
        errors = check(data, side)
        for e in errors:
            print(f"{path}: {e}")
        if errors:
            failed = True
        else:
            print(f"{path}: ok (lado {side}, {len(data.get('exits') or [])} saídas, {len(data['news'])} notícias)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
