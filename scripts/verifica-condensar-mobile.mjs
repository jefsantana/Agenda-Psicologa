// Verifica os 3 ajustes de densidade do dashboard no celular:
//   1. "Atendimentos por convênio": a lista por convênio começa recolhida no
//      celular (só o botão "Ver por convênio"); no desktop aparece sempre.
//   2. Calendário do dashboard: recolhido por padrão no celular, com botão de
//      abrir/fechar que grava a escolha; no desktop fica sempre aberto.
//   3. Lembrete de pendências: a ação vira um botão (sem sublinhado de link).
//
// Renderiza a casca autenticada por sessão-stub em 390px e 1280px, exercita o
// toggle real do calendário e injeta a marcação de convênio/lembrete para medir
// o CSS. Imprime CONDENSAR_MOBILE_OK e sai 0 só se tudo passar.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { extname, join, normalize } from "node:path";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../dist/", import.meta.url));
const PORT = 4325;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };

function fail(msg) {
  console.error("FALHOU: " + msg);
  process.exit(1);
}
if (!existsSync(ROOT)) fail("dist/ não existe — rode `npm run build` antes.");

function refDoSupabase() {
  try {
    const env = readFileSync(fileURLToPath(new URL("../.env.local", import.meta.url)), "utf8");
    const m = env.match(/VITE_SUPABASE_URL\s*=\s*https?:\/\/([a-z0-9]+)\.supabase\.co/i);
    if (m) return m[1];
  } catch {}
  try {
    const js = readdirSync(join(ROOT, "assets")).find((f) => /^index-.*\.js$/.test(f));
    const src = readFileSync(join(ROOT, "assets", js), "utf8");
    const m = src.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
    if (m) return m[1];
  } catch {}
  return null;
}
const REF = refDoSupabase();
if (!REF) fail("não achei o ref do Supabase (.env.local ou dist/assets).");

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => existsSync(p));
if (!CHROME) fail("Chrome não encontrado.");

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/" || !extname(p)) p = "/index.html";
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(normalize(ROOT))) return res.writeHead(403).end();
    await stat(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end("nao encontrado");
  }
});
await new Promise((r) => server.listen(PORT, r));

const userDir = join(process.env.TEMP || "/tmp", `verifica-condensar-chrome-${Date.now()}`);
const chrome = spawn(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-features=ServiceWorker",
  "--remote-debugging-port=9336", `--user-data-dir=${userDir}`, "about:blank",
], { stdio: "ignore" });

const cleanup = () => {
  try { chrome.kill(); } catch {}
  try { rmSync(userDir, { recursive: true, force: true }); } catch {}
  server.close();
};
process.on("exit", cleanup);

async function cdp() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch("http://127.0.0.1:9336/json/list")).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  fail("Chrome CDP não respondeu.");
}
const page = await cdp();
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
const evalR = async (expression) => (await send("Runtime.evaluate", { returnByValue: true, expression })).result.value;

await send("Page.enable");
await send("Runtime.enable");

const sess = JSON.stringify({ access_token: "stub", token_type: "bearer", expires_in: 3600, expires_at: 9999999999, refresh_token: "stub", user: { id: "00000000-0000-0000-0000-000000000000", aud: "authenticated", role: "authenticated", email: "l@e.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" } });

// Marcação estática (React não roda com dados no stub) para medir o CSS do
// card de convênio e do lembrete.
const injetarMarcacao = `(() => {
  const sec = document.querySelector('.convenios-painel');
  if (sec && !sec.querySelector('.convenios-toggle')) {
    sec.insertAdjacentHTML('beforeend',
      '<button class="convenios-toggle">Ver por convênio (3)</button>' +
      '<ul class="convenios-legenda"><li class="convenios-legenda__item">x</li></ul>');
  }
  const c = document.querySelector('.shell__content');
  if (c && !document.querySelector('.dashboard__lembrete')) {
    const d = document.createElement('div');
    d.className = 'dashboard__lembrete';
    d.innerHTML = '<p>x</p><a href="#" class="dashboard__lembrete__acao">Resolver na Agenda</a>';
    c.insertBefore(d, c.firstChild);
  }
  return 'ok';
})()`;

const problems = [];

async function carregar(width) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 1024, screenWidth: width, screenHeight: 900 });
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 900));
  await evalR(`localStorage.setItem('sb-${REF}-auth-token', ${JSON.stringify(sess)}); localStorage.removeItem('dashboard:calendario-aberto'); 'ok'`);
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/#/hoje` });
  await new Promise((r) => setTimeout(r, 5000));
  await evalR(injetarMarcacao);
  await new Promise((r) => setTimeout(r, 300));
}

// ---- celular (390px) ----
await carregar(390);
let m = await evalR(`(() => {
  const leg = document.querySelector('.convenios-legenda');
  const tog = document.querySelector('.convenios-toggle');
  const cal = document.querySelector('.calendario');
  const corpo = document.querySelector('.calendario__corpo');
  const rec = document.querySelector('.calendario__recolher');
  const acao = document.querySelector('.dashboard__lembrete__acao');
  return {
    legNone: leg ? getComputedStyle(leg).display === 'none' : null,
    togShown: tog ? getComputedStyle(tog).display !== 'none' : null,
    calFechado: cal ? cal.className.includes('calendario--fechado') : null,
    corpoNone: corpo ? getComputedStyle(corpo).display === 'none' : null,
    recShown: rec ? getComputedStyle(rec).display !== 'none' : null,
    acaoDeco: acao ? getComputedStyle(acao).textDecorationLine : null,
    acaoMinH: acao ? parseFloat(getComputedStyle(acao).minHeight) : null,
  };
})()`);
if (m.legNone !== true) problems.push(`390px: legenda de convênio deveria começar escondida (display=${m.legNone})`);
if (m.togShown !== true) problems.push(`390px: botão "Ver por convênio" não aparece`);
if (m.calFechado !== true) problems.push(`390px: calendário deveria começar recolhido`);
if (m.corpoNone !== true) problems.push(`390px: corpo do calendário deveria estar escondido`);
if (m.recShown !== true) problems.push(`390px: botão de recolher o calendário não aparece`);
if (m.acaoDeco !== "none") problems.push(`390px: ação do lembrete ainda está sublinhada (${m.acaoDeco})`);
if (!(m.acaoMinH >= 36)) problems.push(`390px: ação do lembrete sem alvo de toque (min-height=${m.acaoMinH})`);

// abrir o calendário e conferir que fica lembrado
const abriu = await evalR(`(() => {
  const r = document.querySelector('.calendario__recolher');
  if (!r) return { erro: 'sem botao' };
  r.click();
  return { erro: null };
})()`);
if (abriu.erro) problems.push(`390px: ${abriu.erro}`);
await new Promise((r) => setTimeout(r, 300));
m = await evalR(`(() => {
  const cal = document.querySelector('.calendario');
  const corpo = document.querySelector('.calendario__corpo');
  return {
    aberto: cal ? !cal.className.includes('calendario--fechado') : null,
    corpoShown: corpo ? getComputedStyle(corpo).display !== 'none' : null,
    ls: localStorage.getItem('dashboard:calendario-aberto'),
  };
})()`);
if (m.aberto !== true) problems.push(`390px: calendário não abriu ao tocar no botão`);
if (m.corpoShown !== true) problems.push(`390px: corpo do calendário não apareceu depois de abrir`);
if (m.ls !== "1") problems.push(`390px: escolha de abrir o calendário não foi gravada (localStorage=${m.ls})`);

// ---- desktop (1280px) ----
await carregar(1280);
m = await evalR(`(() => {
  const leg = document.querySelector('.convenios-legenda');
  const tog = document.querySelector('.convenios-toggle');
  const corpo = document.querySelector('.calendario__corpo');
  const rec = document.querySelector('.calendario__recolher');
  const resumo = document.querySelector('.calendario__resumo');
  return {
    legShown: leg ? getComputedStyle(leg).display !== 'none' : null,
    togHidden: tog ? getComputedStyle(tog).display === 'none' : null,
    corpoShown: corpo ? getComputedStyle(corpo).display !== 'none' : null,
    recHidden: rec ? getComputedStyle(rec).display === 'none' : null,
    resumoHidden: resumo ? getComputedStyle(resumo).display === 'none' : true,
  };
})()`);
if (m.legShown !== true) problems.push(`1280px: legenda de convênio deveria aparecer sempre no desktop`);
if (m.togHidden !== true) problems.push(`1280px: botão "Ver por convênio" deveria sumir no desktop`);
if (m.corpoShown !== true) problems.push(`1280px: corpo do calendário deveria ficar visível no desktop`);
if (m.recHidden !== true) problems.push(`1280px: botão de recolher deveria sumir no desktop`);
if (m.resumoHidden !== true) problems.push(`1280px: resumo do calendário deveria sumir no desktop`);

ws.close();
cleanup();

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("CONDENSAR_MOBILE_OK");
process.exit(0);
