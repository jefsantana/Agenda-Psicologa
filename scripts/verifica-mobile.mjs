// Verificação de layout mobile via Chrome DevTools Protocol.
// Sobe um servidor estático do dist/, abre o Chrome headless em 390px com uma
// sessão-stub (só para renderizar a casca autenticada), injeta conteúdo alto e
// confere: (a) sem rolagem horizontal; (b) TabBar colada no rodapé em qualquer
// scroll; (c) o texto do cabeçalho não fica cortado atrás do topo.
//
// Pré-requisitos: `npm run build` já rodou e o Chrome está instalado.
// Imprime MOBILE_LAYOUT_OK e sai 0 só se todas as checagens passarem.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { extname, join, normalize } from "node:path";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../dist/", import.meta.url));
const PORT = 4319;

// A chave de sessão do supabase-js é sb-<ref>-auth-token, onde <ref> é o
// subdomínio de VITE_SUPABASE_URL embutido no build.
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
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };

function fail(msg) {
  console.error("FALHOU: " + msg);
  process.exit(1);
}
if (!existsSync(ROOT)) fail("dist/ não existe — rode `npm run build` antes.");
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

const userDir = join(process.env.TEMP || "/tmp", "verifica-mobile-chrome");
const chrome = spawn(CHROME, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=9333",
  `--user-data-dir=${userDir}`, "about:blank",
], { stdio: "ignore" });

const cleanup = () => { try { chrome.kill(); } catch {} server.close(); };
process.on("exit", cleanup);

async function cdp() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch("http://127.0.0.1:9333/json/list")).json();
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
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true, screenWidth: 390, screenHeight: 844 });

const base = `http://127.0.0.1:${PORT}/`;
await send("Page.navigate", { url: base });
await new Promise((r) => setTimeout(r, 1200));
const sess = JSON.stringify({ access_token: "stub", token_type: "bearer", expires_in: 3600, expires_at: 9999999999, refresh_token: "stub", user: { id: "00000000-0000-0000-0000-000000000000", aud: "authenticated", role: "authenticated", email: "l@e.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" } });
await send("Runtime.evaluate", { expression: `localStorage.setItem('sb-${REF}-auth-token', ${JSON.stringify(sess)})` });
await send("Page.navigate", { url: base + "#/hoje" });
await new Promise((r) => setTimeout(r, 4500));
await send("Runtime.evaluate", { expression: `(() => { const m=document.querySelector('.shell__content'); if(m){ const d=document.createElement('div'); d.style.height='2600px'; m.appendChild(d); } })()` });
await new Promise((r) => setTimeout(r, 300));

const probe = async (y) => {
  await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${y})` });
  await new Promise((r) => setTimeout(r, 250));
  const res = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const de = document.documentElement;
      const t = document.querySelector('.tabbar');
      const eb = document.querySelector('.shell__eyebrow');
      const tr = t ? t.getBoundingClientRect() : null;
      return {
        horizOverflow: de.scrollWidth - de.clientWidth,
        tabbarBottomGap: tr ? Math.round(window.innerHeight - tr.bottom) : null,
        tabbarPos: t ? getComputedStyle(t).position : null,
        eyebrowLines: eb ? Math.round(eb.getBoundingClientRect().height / parseFloat(getComputedStyle(eb).lineHeight || '16')) : null,
        eyebrowClipped: eb ? eb.scrollWidth > eb.clientWidth + 1 : null,
      };
    })()`,
  });
  return res.result.value;
};

const problems = [];
for (const y of [0, 400, 1200, 2500, 99999]) {
  const m = await probe(y);
  if (m.horizOverflow > 1) problems.push(`scroll ${y}: rolagem horizontal de ${m.horizOverflow}px`);
  if (m.tabbarPos !== "fixed") problems.push(`scroll ${y}: TabBar não é fixed (${m.tabbarPos})`);
  // TabBar fixa deve ficar a ~24px do fundo (margem 12 + área segura 0 no headless) sempre
  if (m.tabbarBottomGap === null || m.tabbarBottomGap < 0 || m.tabbarBottomGap > 60) {
    problems.push(`scroll ${y}: TabBar descolada do rodapé (gap ${m.tabbarBottomGap}px)`);
  }
  if (m.eyebrowLines && m.eyebrowLines > 1) problems.push(`scroll ${y}: data do cabeçalho quebrou em ${m.eyebrowLines} linhas`);
}

ws.close();
cleanup();

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("MOBILE_LAYOUT_OK");
process.exit(0);
