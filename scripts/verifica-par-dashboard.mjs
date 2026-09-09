// Regressão do "estouro" dos cards "Atendimentos por convênio" e "Tarefas".
// Renderiza o dashboard (casca autenticada por sessão-stub) em 360–430px,
// injeta uma tarefa de nome longo e a legenda de convênios com dados de
// exemplo, e confere que NENHUM elemento dentro de .dashboard__grade passa da
// borda direita da viewport (o overflow-x: hidden esconde a barra de rolagem,
// então documentElement.scrollWidth não acusa — a checagem é por elemento).
//
// Pré-requisitos: `npm run build` já rodou e o Chrome está instalado.
// Imprime PAR_DASHBOARD_OK e sai 0 só se todas as larguras passarem.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { extname, join, normalize } from "node:path";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../dist/", import.meta.url));
const PORT = 4320;
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

const userDir = join(process.env.TEMP || "/tmp", `verifica-par-chrome-${Date.now()}`);
const chrome = spawn(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-features=ServiceWorker",
  "--remote-debugging-port=9335", `--user-data-dir=${userDir}`, "about:blank",
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
      const list = await (await fetch("http://127.0.0.1:9335/json/list")).json();
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

await send("Page.enable");
await send("Runtime.enable");

const sess = JSON.stringify({ access_token: "stub", token_type: "bearer", expires_in: 3600, expires_at: 9999999999, refresh_token: "stub", user: { id: "00000000-0000-0000-0000-000000000000", aud: "authenticated", role: "authenticated", email: "l@e.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" } });

const injeta = `(() => {
  const sec = document.querySelector('.convenios-painel');
  if (sec) {
    const f = [['Bradesco Saúde (teste)', 35, 13, 'var(--chart-1)'], ['SulAmérica (teste)', 33, 12, 'var(--chart-2)'], ['Unimed (teste)', 20, 12, 'var(--chart-3)'], ['Particular', 12, 8, 'var(--pink)']];
    sec.innerHTML = '<div class="convenios-painel__cabecalho"><h2>Atendimentos por convênio</h2><span class="convenios-painel__mes">setembro</span></div>' +
      '<div class="convenios-painel__total"><span class="convenios-painel__total-numero">45</span><span class="convenios-painel__total-rotulo">sessões</span></div>' +
      '<div class="convenios-barra">' + f.map((x) => '<span class="convenios-barra__segmento" style="flex:' + x[2] + ';background:' + x[3] + '"></span>').join('') + '</div>' +
      '<ul class="convenios-legenda">' + f.map((x) => '<li class="convenios-legenda__item"><span class="convenios-legenda__ponto" style="background:' + x[3] + '"></span><span class="convenios-legenda__nome">' + x[0] + '</span><span class="convenios-legenda__pct">' + x[1] + '%</span><span class="convenios-legenda__contagem">' + x[2] + '</span></li>').join('') + '</ul>';
  }
  const tp = document.querySelector('.tarefas');
  if (tp) {
    const v = tp.querySelector('.tarefas__vazio');
    if (v) {
      const ul = document.createElement('ul');
      ul.className = 'tarefas__lista';
      ul.innerHTML = '<li class="tarefas__item"><button class="tarefas__checkbox"></button><div class="tarefas__texto"><span class="tarefas__titulo">Atualizar prontuário (teste) e conferir carteirinha · Paciente Teste 04</span><span class="tarefas__prazo tarefas__prazo--futura">17/09</span></div><div class="menu-acoes-linha"><button class="menu-acoes-linha__botao" aria-label="Mais opções">\\u22ee</button></div></li>';
      v.replaceWith(ul);
    }
  }
  return 'ok';
})()`;

const problems = [];
for (const W of [360, 375, 390, 412, 430]) {
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: 900, deviceScaleFactor: 2, mobile: true, screenWidth: W, screenHeight: 900 });
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 900));
  await send("Runtime.evaluate", { expression: `localStorage.setItem('sb-${REF}-auth-token', ${JSON.stringify(sess)})` });
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/#/hoje` });
  await new Promise((r) => setTimeout(r, 4800));
  await send("Runtime.evaluate", { expression: injeta });
  await new Promise((r) => setTimeout(r, 400));
  const res = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const vw = innerWidth;
      const bad = [];
      const scope = document.querySelector('.dashboard__grade');
      if (!scope) return { erro: 'sem .dashboard__grade' };
      for (const el of scope.querySelectorAll('*')) {
        const b = el.getBoundingClientRect();
        if (b.width > 0 && b.right > vw + 0.5) {
          bad.push((typeof el.className === 'string' ? el.className : el.tagName) + ' (R' + Math.round(b.right) + ')');
        }
      }
      return { vw, bad: [...new Set(bad)].slice(0, 8) };
    })()`,
  });
  const v = res.result.value;
  if (v.erro) problems.push(`${W}px: ${v.erro}`);
  else if (v.bad.length) problems.push(`${W}px: elementos fora da borda — ${v.bad.join(", ")}`);
}

ws.close();
cleanup();

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("PAR_DASHBOARD_OK");
process.exit(0);
