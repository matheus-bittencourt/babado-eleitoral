# Babado Eleitoral

Site estático de sátira sobre o pós-2º turno de 2026: notícias sobre Flávio Bolsonaro, a campanha e os apoiadores famosos, cada uma com um "pitaco" de humor separado do fato. Publicado no GitHub Pages.

## Estrutura

- `site/index.html`: página única; lê `site/data.json` por `fetch` e busca de novo a cada 5 min. Compartilhamento nativo do celular (`navigator.share`), links de WhatsApp/X/Threads/Telegram/Facebook e card 1080×1920 para Stories gerado em canvas.
- `site/data.json`: fonte de verdade. `result` (placar e fato do resultado), `exits` (destaque "Malas prontas?") e `news` (até 40 notas). Os fatos (`h`, `p`, `d`, `src`, `u`, `q`, `s`) vêm do Radar dos apoiadores de Flávio (artifact privado do dono do projeto); o pitaco fica em `r`.
- `site/app.js`: todo o JavaScript da página. Fica fora do HTML para a CSP (meta no `index.html`) permitir só scripts do próprio site.
- `check_data.py`: valida o `data.json` (só biblioteca padrão). Roda no workflow antes de publicar.
- `check_privacy.py`: barra a publicação se algum arquivo versionado tiver chave, token, e-mail pessoal, CPF, telefone ou caminho de pasta pessoal, ou se aparecer arquivo fora da lista `ALLOWED`.
- `.github/workflows/publicar.yml`: a cada push no `main`, roda os testes e o validador e publica `site/`.
- A atualização vem da tarefa agendada "Radar dos apoiadores de Flávio" do app do Claude (7h e 18h), que edita `site/data.json`, faz commit e push. O Actions não chama LLM.

## Comandos

```bash
python check_data.py                     # valida site/data.json
python check_privacy.py                  # segredos e dados pessoais nos arquivos versionados
python -m unittest discover -s tests     # rodar antes de qualquer commit
cd site && python -m http.server 8000    # ver o site (file:// não carrega o JSON)
```

## Regras

- **Fato não se inventa nem se altera.** Cada nota precisa de link `https` real para a reportagem. Manchete reescrita com palavras próprias; citação literal com no máximo 15 palavras.
- O pitaco é humor sobre comportamento público de figuras públicas, dos dois lados. Não traz fato novo, não contradiz o fato da nota, não fala de aparência, saúde ou família além do que a reportagem diz, não acusa ninguém de crime. Toda nota nova leva pitaco, inclusive as de investigação ou processo: nesses casos o pitaco zoa só o que a pessoa disse ou fez em público (declarações, reações, contradições), nunca o mérito da acusação, e não insinua culpa nem fuga.
- Boato sem confirmação de outro veículo: `st: "unk"` no `exits`, ou descrito como não confirmado na nota.
- O texto entra na página por `textContent`; o validador recusa `<` e `>`. Mantenha assim.
- Push no `main` republica o site público.
- Nada pessoal no repositório: sem e-mail (commits usam o noreply do GitHub), sem caminhos locais, sem links de artifacts privados, sem chaves. Arquivo novo precisa entrar em `ALLOWED` no `check_privacy.py`.
- Não afrouxe a CSP do `index.html` nem volte o script para dentro do HTML.
