// Babado Eleitoral: renderização a partir de data.json e compartilhamento
const GROUPS = ["Todos", "Flávio e campanha", "Música", "TV e cinema", "Esporte", "Influenciadores", "Religiosos"];
const MES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const PAGE_URL = location.origin + location.pathname;
const canNative = typeof navigator.share === "function";
const state = { q: "", g: "Todos" };
let DATA = null;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function link(label, url) {
  const a = el("a", null, label);
  a.href = url; a.target = "_blank"; a.rel = "noopener";
  return a;
}
function fold(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function clip(s, n) { return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; }
function dateLabel(n) {
  const [y, m, d] = n.d.split("-");
  return n.dm ? MES[+m - 1] + " " + y : d + " " + MES[+m - 1] + " " + y;
}
function factRow(text) {
  const r = el("div", "row");
  r.append(el("span", "lab fact", "O fato"), el("p", null, text));
  return r;
}
function sources(list) {
  const s = el("span", "src", "Fontes: ");
  list.forEach(([l, u], i) => { if (i) s.append(" · "); s.append(link(l, u)); });
  return s;
}
function pct(v) { return v.toFixed(2).replace(".", ",") + "%"; }

function drawResult() {
  const r = DATA.result;
  const box = document.getElementById("result");
  const score = el("div", "score");
  const c1 = el("div", "cand"), c2 = el("div", "cand");
  c1.append(el("b", null, pct(r.lula)), el("span", null, "Lula (PT) · reeleito"));
  c2.append(el("b", null, pct(r.flavio)), el("span", null, "Flávio (PL)"));
  score.append(c1, c2);
  const bar = el("div", "bar");
  bar.setAttribute("role", "img");
  bar.setAttribute("aria-label", "Lula " + pct(r.lula) + ", Flávio " + pct(r.flavio));
  const fill = el("i");
  fill.style.width = r.lula + "%";
  bar.append(fill);
  box.replaceChildren(score, bar, factRow(r.fact), el("p", "pitaco", r.r), sources(r.s));
}

function drawExits() {
  document.getElementById("exits").replaceChildren(...DATA.exits.map(x => {
    const c = el("article", "ex");
    const head = el("div", "ex-head");
    const t = el("div");
    t.append(el("h3", "ex-name", x.n), el("div", "ex-role", x.role));
    head.append(t, el("span", "st " + x.st, x.stl));
    c.append(head);
    if (x.q) c.append(el("p", "quote", "“" + x.q + "”"));
    c.append(factRow(x.p), el("p", "pitaco", x.r), sources(x.s), shareButton({
      title: x.n + ": " + x.stl.toLowerCase(),
      fact: x.q ? "“" + x.q + "”" : clip(x.p, 220),
      roast: x.r, src: x.s[0][0], url: x.s[0][1], date: DATA.updated_label.split(",")[0]
    }));
    return c;
  }));
}

function drawFeed() {
  document.getElementById("cats").replaceChildren(...GROUPS.map(g => {
    const b = el("button", "chip", g);
    b.type = "button";
    b.setAttribute("aria-pressed", String(state.g === g));
    b.addEventListener("click", () => { state.g = g; drawFeed(); });
    return b;
  }));
  const q = fold(state.q.trim());
  const rows = DATA.news.filter(n =>
    (state.g === "Todos" || n.g === state.g) &&
    (!q || fold(n.h + " " + n.p + " " + (n.r || "") + " " + n.who.join(" ") + " " + n.src).includes(q))
  ).sort((a, b) => b.d.localeCompare(a.d));
  document.getElementById("feed").replaceChildren(...(rows.length ? rows.map(n => {
    const li = el("li", "item");
    const meta = el("div", "meta");
    meta.append(el("span", "date", dateLabel(n)), el("span", null, "· " + n.src));
    const h = el("h3", "hd");
    h.append(link(n.h, n.u));
    li.append(meta, h);
    if (n.p) li.append(factRow(n.p));
    if (n.r) li.append(el("p", "pitaco", n.r));
    const who = el("div", "who");
    if (n.check) who.append(el("span", "check", "Checagem"));
    n.who.forEach(w => who.append(el("span", null, w)));
    li.append(who, shareButton({
      title: n.h, fact: n.p ? clip(n.p, 220) : "", roast: n.r || "", src: n.src, url: n.u, date: dateLabel(n)
    }));
    return li;
  }) : [el("li", "empty", "Nenhum babado com esse filtro.")]));
  document.getElementById("count").textContent = rows.length + " de " + DATA.news.length + " babados";
}

function draw() {
  document.getElementById("edition").textContent = "Edição de " + DATA.updated_label;
  document.getElementById("updated").textContent = "Última atualização: " + DATA.updated_label + " (horário de Brasília). A página confere se há edição nova a cada 5 minutos.";
  drawResult(); drawExits(); drawFeed();
}

async function load() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    if (DATA && DATA.updated === data.updated) return;
    DATA = data;
    draw();
  } catch (e) {
    if (!DATA) document.getElementById("feed").replaceChildren(el("li", "empty", "Não deu para carregar os babados agora. Recarregue a página em instantes."));
  }
}

// ---------- Compartilhamento ----------
const PAGE_ITEM = {
  title: "Babado Eleitoral: a ressaca do 2º turno, com fatos checados e pitacos sem pena",
  fact: "Lula 51,79% × Flávio 48,21%. Flávio diz que vai pedir a anulação da eleição.",
  roast: "Pediu prorrogação, ganhou prorrogação, perdeu a eleição e culpou a prorrogação.",
  src: "InfoMoney", url: "https://www.infomoney.com.br/politica/ao-vivo-eleicoes-segundo-turno-2026/", date: "26 out 2026"
};
let current = null, storyFile = null, storyUrl = null, opener = null;
const enc = encodeURIComponent;

function waText(it) {
  const lines = ["*Babado Eleitoral*", "📰 " + it.title + (it.date ? " (" + it.date + ")" : "")];
  if (it.roast) lines.push("_Pitaco:_ " + it.roast);
  if (it.url) lines.push("Fonte: " + it.src + " " + it.url);
  lines.push("Mais babados: " + PAGE_URL);
  return lines.join("\n");
}
function plainText(it) {
  return it.title + (it.roast ? "\n\nPitaco: " + it.roast : "") + (it.url ? "\nFonte: " + it.src + " " + it.url : "");
}
function nets(it) {
  return [
    ["WhatsApp", "wa", "https://wa.me/?text=" + enc(waText(it))],
    ["X", "", "https://twitter.com/intent/tweet?text=" + enc(clip(it.title + (it.roast ? " | Pitaco: " + it.roast : ""), 220)) + "&url=" + enc(PAGE_URL)],
    ["Threads", "", "https://www.threads.net/intent/post?text=" + enc(clip(plainText(it), 380) + "\n" + PAGE_URL)],
    ["Telegram", "", "https://t.me/share/url?url=" + enc(PAGE_URL) + "&text=" + enc(clip(plainText(it), 900))],
    ["Facebook", "", "https://www.facebook.com/sharer/sharer.php?u=" + enc(PAGE_URL)]
  ];
}
function netLinks(it) {
  return nets(it).map(([label, cls, href]) => {
    const a = el("a", "sbtn " + cls, label);
    a.href = href; a.target = "_blank"; a.rel = "noopener";
    return a;
  });
}
function shareButton(it) {
  const b = el("button", "share-mini", "Compartilhar");
  b.type = "button";
  b.addEventListener("click", () => openSheet(it, b));
  return b;
}
function nativeShare(it, onFail) {
  navigator.share({ title: "Babado Eleitoral", text: plainText(it), url: PAGE_URL })
    .catch(e => { if (!e || e.name !== "AbortError") onFail(); });
}

function setStatus(t) { document.getElementById("sheet-status").textContent = t; }
function copy(text, okMsg) {
  const box = document.getElementById("copybox");
  box.hidden = true;
  const fallback = () => {
    box.value = text; box.hidden = false; box.focus(); box.select();
    setStatus("Não deu para copiar sozinho. O texto está selecionado abaixo: copie pelo menu do celular.");
  };
  try {
    navigator.clipboard.writeText(text).then(() => setStatus(okMsg), fallback);
  } catch (e) { fallback(); }
}

// Card 1080×1920 para Stories, com as cores do tabloide (é uma imagem, não segue o tema)
const K = { bg: "#fff5f9", ink: "#1c0f16", pink: "#d1105f", pinkSoft: "#fde1ee", marker: "#ffe94d", markerInk: "#3a2f00", fact: "#0f5f66", factSoft: "#ddf1f2", muted: "#6e5562" };
function wrapLines(g, text, maxW) {
  const out = [];
  text.split("\n").forEach(par => {
    let line = "";
    par.split(" ").forEach(w => {
      const t = line ? line + " " + w : w;
      if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else { line = t; }
    });
    out.push(line);
  });
  return out;
}
async function makeStory(it) {
  try {
    await Promise.all([
      document.fonts.load('110px "Anton"'), document.fonts.load('800 60px "Libre Franklin"'),
      document.fonts.load('400 40px "Libre Franklin"'), document.fonts.load('64px "Caveat Brush"')
    ]);
  } catch (e) {}
  const W = 1080, H = 1920, X = 80, MW = 920;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = K.bg; g.fillRect(0, 0, W, H);
  g.fillStyle = K.pink; g.fillRect(0, 0, W, 250);
  g.fillStyle = "#ffffff";
  let ts = 120;
  do { g.font = ts + 'px "Anton", Impact, sans-serif'; ts -= 4; } while (g.measureText("BABADO ELEITORAL").width > MW);
  g.fillText("BABADO ELEITORAL", X, 180);
  g.fillStyle = K.pink; g.font = '800 34px "Libre Franklin", sans-serif';
  g.fillText(((it.date || "") + " · 2º turno 2026").toUpperCase(), X, 320);

  const top = 380, bottom = 1640;
  let L;
  for (let k = 1; k >= 0.55; k -= 0.05) {
    const hs = Math.round(62 * k), fs = Math.round(40 * k), rs = Math.round(70 * k);
    g.font = '800 ' + hs + 'px "Libre Franklin", sans-serif'; const hl = wrapLines(g, it.title, MW);
    g.font = '400 ' + fs + 'px "Libre Franklin", sans-serif'; const fl = it.fact ? wrapLines(g, it.fact, MW) : [];
    g.font = rs + 'px "Caveat Brush", cursive'; const rl = it.roast ? wrapLines(g, it.roast, MW - 70) : [];
    const h = 60 + hl.length * hs * 1.18 + 26 + fl.length * fs * 1.35 + (rl.length ? 50 + 60 + rl.length * rs * 1.12 + 60 : 0);
    L = { hs, fs, rs, hl, fl, rl };
    if (top + h <= bottom) break;
  }
  const chip = (text, x, y, bg, fg) => {
    g.font = '800 30px "Libre Franklin", sans-serif';
    const w = g.measureText(text).width + 36;
    g.fillStyle = bg; g.fillRect(x, y, w, 50);
    g.fillStyle = fg; g.fillText(text, x + 18, y + 36);
  };
  let y = top;
  chip("O FATO", X, y, K.factSoft, K.fact); y += 60 + L.hs;
  g.fillStyle = K.ink; g.font = '800 ' + L.hs + 'px "Libre Franklin", sans-serif';
  L.hl.forEach(l => { g.fillText(l, X, y); y += L.hs * 1.18; });
  y += 26 - L.hs * 0.18;
  g.fillStyle = K.muted; g.font = '400 ' + L.fs + 'px "Libre Franklin", sans-serif';
  L.fl.forEach(l => { y += L.fs * 1.35; g.fillText(l, X, y - L.fs * 0.35); });
  if (L.rl.length) {
    y += 50;
    chip("PITACO", X, y, K.marker, K.markerInk); y += 60;
    const boxH = L.rl.length * L.rs * 1.12 + 60;
    g.fillStyle = K.pinkSoft; g.fillRect(X, y, MW, boxH);
    g.fillStyle = K.pink; g.fillRect(X, y, 12, boxH);
    g.fillStyle = K.ink; g.font = L.rs + 'px "Caveat Brush", cursive';
    let ry = y + 30 + L.rs * 0.9;
    L.rl.forEach(l => { g.fillText(l, X + 45, ry); ry += L.rs * 1.12; });
  }
  g.fillStyle = K.ink; g.fillRect(X, 1690, MW, 3);
  g.fillStyle = K.muted; g.font = '600 32px "Libre Franklin", sans-serif';
  g.fillText(clip("Fonte: " + (it.src || "—"), 52), X, 1750);
  g.font = '400 28px "Libre Franklin", sans-serif';
  g.fillText("Fato da reportagem · pitaco é opinião da redação", X, 1800);
  g.fillText(PAGE_URL.replace(/^https?:\/\//, ""), X, 1845);
  return new Promise(res => c.toBlob(res, "image/png"));
}

async function openSheet(it, from) {
  current = it; opener = from || null;
  document.getElementById("sheet-sub").textContent = it.title;
  document.getElementById("sheet-native").hidden = !canNative;
  document.getElementById("sheet-nets").replaceChildren(...netLinks(it));
  document.getElementById("copybox").hidden = true;
  setStatus("");
  document.getElementById("scrim").hidden = false;
  document.getElementById("sheet").hidden = false;
  document.getElementById("sheet-close").focus();
  const img = document.getElementById("story-img");
  const share = document.getElementById("story-share");
  const dl = document.getElementById("story-download");
  img.removeAttribute("src"); share.hidden = true; dl.hidden = true;
  const blob = await makeStory(it);
  if (current !== it || !blob) return;
  storyFile = new File([blob], "babado-eleitoral-stories.png", { type: "image/png" });
  if (storyUrl) URL.revokeObjectURL(storyUrl);
  storyUrl = URL.createObjectURL(blob);
  img.src = storyUrl;
  dl.href = storyUrl;
  const canFiles = canNative && typeof navigator.canShare === "function" && navigator.canShare({ files: [storyFile] });
  share.hidden = !canFiles;
  dl.hidden = false;
}
function closeSheet() {
  document.getElementById("sheet").hidden = true;
  document.getElementById("scrim").hidden = true;
  current = null;
  if (opener) opener.focus();
}

const pageShare = document.getElementById("pageShare");
if (canNative) {
  const b = el("button", "sbtn main", "Compartilhar");
  b.type = "button";
  b.addEventListener("click", () => nativeShare(PAGE_ITEM, () => openSheet(PAGE_ITEM, b)));
  pageShare.append(b);
}
pageShare.append(...netLinks(PAGE_ITEM), (() => {
  const b = el("button", "sbtn ig", "Instagram Stories");
  b.type = "button";
  b.addEventListener("click", () => openSheet(PAGE_ITEM, b));
  return b;
})(), (() => {
  const b = el("button", "sbtn", "Copiar link");
  b.type = "button";
  b.addEventListener("click", () => {
    navigator.clipboard.writeText(PAGE_URL).then(() => { b.textContent = "Link copiado"; }, () => openSheet(PAGE_ITEM, b));
  });
  return b;
})());

document.getElementById("native-text").addEventListener("click", () => {
  if (current) nativeShare(current, () => setStatus("O compartilhar do celular não abriu. Use os botões abaixo."));
});
document.getElementById("story-share").addEventListener("click", () => {
  if (!storyFile) return;
  navigator.share({ files: [storyFile], title: "Babado Eleitoral" })
    .then(() => setStatus("Pronto."))
    .catch(e => { if (!e || e.name !== "AbortError") setStatus("Não deu para compartilhar a imagem. Use \"Baixar imagem\"."); });
});
document.getElementById("sheet-close").addEventListener("click", closeSheet);
document.getElementById("scrim").addEventListener("click", closeSheet);
document.addEventListener("keydown", e => { if (e.key === "Escape" && !document.getElementById("sheet").hidden) closeSheet(); });
document.getElementById("copy-text").addEventListener("click", () => { if (current) copy(waText(current), "Texto copiado. É só colar no app."); });
document.getElementById("copy-link").addEventListener("click", () => copy(PAGE_URL, "Link copiado. No Stories, use o sticker Link."));
document.getElementById("q").addEventListener("input", e => { state.q = e.target.value; if (DATA) drawFeed(); });

load();
setInterval(load, 5 * 60 * 1000);
