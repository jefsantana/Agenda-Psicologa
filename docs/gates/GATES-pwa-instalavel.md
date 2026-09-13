# Gates: App instalável no celular (PWA)

OWNS: vite.config.js, index.html, public/pwa-maskable.svg, package.json

Scope: transformar o app em PWA instalável — `vite-plugin-pwa` gera o `manifest.webmanifest` e um service worker (Workbox `generateSW`) que faz precache da casca do app. No celular passa a aparecer "Instalar app" (Android) / "Adicionar à Tela de Início" (iPhone), abrindo em tela cheia com ícone próprio. `scope`/`start_url` derivam do `base` do Vite (o deploy roda com `--base=/Agenda-Psicologa/`), nada fixado à mão. Ícones em SVG (`favicon.svg` + `pwa-maskable.svg`) — sem dependência de rasterização. Fora do escopo: ícones PNG para iOS antigo, notificações push, cache de dados do Supabase para uso offline real, publicação em loja (TWA/Capacitor).

- [x] G1: `vite-plugin-pwa` está configurado no vite.config.js com manifest e Workbox
  CHECK: node -e "const c=require('fs').readFileSync('vite.config.js','utf8'); if(!/vite-plugin-pwa/.test(c)||!/VitePWA\(/.test(c)||!/manifest:/.test(c)||!/registerType:\s*'autoUpdate'/.test(c)) throw new Error('config PWA incompleta'); console.log('PWA_CFG_OK')"
  EXPECT: PWA_CFG_OK

- [x] G2: o build gera service worker + manifest + registro
  CHECK: npm run build && node -e "const fs=require('fs'); for (const f of ['dist/sw.js','dist/manifest.webmanifest','dist/registerSW.js']) if(!fs.existsSync(f)) throw new Error('faltou '+f); if(!/rel=\"manifest\"/.test(fs.readFileSync('dist/index.html','utf8'))) throw new Error('index.html sem link manifest'); console.log('PWA_BUILD_OK')"
  EXPECT: PWA_BUILD_OK

- [x] G3: o manifest tem os campos de instalação (name, display standalone, ícones any + maskable, cores)
  CHECK: node -e "const m=JSON.parse(require('fs').readFileSync('dist/manifest.webmanifest','utf8')); if(m.name!=='Espaço Raquel Fróis') throw new Error('name'); if(m.display!=='standalone') throw new Error('display'); if(!m.theme_color||!m.background_color) throw new Error('cores'); const p=m.icons.map(i=>i.purpose).join(' '); if(!/any/.test(p)||!/maskable/.test(p)) throw new Error('icones any+maskable'); console.log('MANIFEST_OK')"
  EXPECT: MANIFEST_OK

- [x] G4: scope e start_url acompanham o --base do deploy (não ficam fixos em "/")
  CHECK: npm run build -- --base=/Agenda-Psicologa/ && node -e "const m=JSON.parse(require('fs').readFileSync('dist/manifest.webmanifest','utf8')); if(m.scope!=='/Agenda-Psicologa/'||m.start_url!=='/Agenda-Psicologa/') throw new Error('scope/start_url: '+m.scope+' '+m.start_url); console.log('BASE_OK')"
  EXPECT: BASE_OK

- [x] G5: index.html traz as metas do iOS e o apple-touch-icon
  CHECK: node -e "const c=require('fs').readFileSync('index.html','utf8'); for (const t of ['apple-mobile-web-app-capable','apple-mobile-web-app-status-bar-style','apple-mobile-web-app-title','rel=\"apple-touch-icon\"']) if(!c.includes(t)) throw new Error('faltou '+t); console.log('IOS_META_OK')"
  EXPECT: IOS_META_OK

- [x] G6: lint limpo + suíte verde + build (restaura o base padrão)
  CHECK: npx oxlint && npm test && npm run build
  EXPECT: built in
