# Gates: Correção de responsividade no celular (v2)

OWNS: src/styles/tokens.css, src/index.css, src/components/layout/AppShell.css, src/components/layout/AppShell.jsx, src/components/layout/TabBar.css, scripts/verifica-mobile.mjs

Escopo: três defeitos reais relatados pela usuária ao abrir no celular, confirmados por
captura via Chrome DevTools Protocol em 390px (a auditoria estática anterior,
`GATES-auditoria-responsividade-mobile.md`, não os pegou):

1. **Faixa vazia ao arrastar para os lados** — `html` sem `overflow-x` nem
   `overscroll-behavior-x`, deixando o "puxão" elástico horizontal do iOS revelar
   um vão. Corrigido travando os dois no `html` e no `body`.
2. **Nome e data no topo cortados** — `index.html` usa `viewport-fit=cover` mas o
   cabeçalho não somava `env(safe-area-inset-top)`; em PWA / celular com notch o
   texto some atrás da barra de status. Além disso `.shell__eyebrow` quebrava em
   duas linhas por falta de `min-width: 0` no contêiner de texto. Corrigido com
   tokens `--safe-*`, padding de área segura no `.shell__header`, `min-width: 0` no
   `.shell__header-texto` e fonte/entrelinha menores + `nowrap`/ellipsis na eyebrow.
3. **TabBar (menu inferior) flutuando no meio do conteúdo** — `position: sticky;
   bottom: 0` se desprende no iOS. Trocado por `position: fixed`, com
   `padding-bottom` no `.shell__content` reservando o espaço da barra.

Sem escopo: outras telas (Financeiro, Prontuário…), ícones PNG do PWA, o "site para
computador" do navegador (config do aparelho, não do código).

---

- [x] G1: `html` trava a rolagem/overscroll horizontal
  CHECK: node -e "const c=require('fs').readFileSync('src/index.css','utf8'); const m=c.match(/html\s*\{[^}]*\}/g)||[]; const j=m.join(' '); if(!/overflow-x:\s*(hidden|clip)/.test(j)) throw new Error('html sem overflow-x'); if(!/overscroll-behavior-x:\s*none/.test(c) && !/overscroll-behavior:\s*none/.test(c)) throw new Error('sem overscroll-behavior-x'); console.log('G1_OK')"
  EXPECT: G1_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=12f841018a5fb79f124a27a4fae08421644bf1e3d94346a382aff5761ae59efb; output-bytes=6

- [x] G2: existe token de área segura do topo e o cabeçalho o aplica no padding
  CHECK: node -e "const fs=require('fs'); const t=fs.readFileSync('src/styles/tokens.css','utf8'); if(!/--safe-top:\s*env\(safe-area-inset-top/.test(t)) throw new Error('token --safe-top ausente'); const a=fs.readFileSync('src/components/layout/AppShell.css','utf8'); const h=(a.match(/\.shell__header\s*\{[^}]*\}/g)||[]).join(' '); if(!/padding-top:[^;]*(safe-top|safe-area-inset-top)/.test(h)) throw new Error('.shell__header sem padding-top de area segura'); console.log('G2_OK')"
  EXPECT: G2_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=e08b6024499f7063fc7e93eefd5be0951553d7144840d659c4857e5c5c167691; output-bytes=6

- [x] G3: a linha da data não quebra — contêiner de texto do cabeçalho tem min-width:0 e a eyebrow trunca
  CHECK: node -e "const fs=require('fs'); const j=fs.readFileSync('src/components/layout/AppShell.jsx','utf8'); if(!/shell__header-texto/.test(j)) throw new Error('div de texto sem classe shell__header-texto'); const a=fs.readFileSync('src/components/layout/AppShell.css','utf8'); const bloco=(a.match(/\.shell__header-texto\s*\{[^}]*\}/g)||[]).join(' '); if(!/min-width:\s*0/.test(bloco)) throw new Error('.shell__header-texto sem min-width:0'); const eb=(a.match(/\.shell__eyebrow\s*\{[^}]*\}/g)||[]).join(' '); if(!/white-space:\s*nowrap/.test(eb)||!/text-overflow:\s*ellipsis/.test(eb)) throw new Error('.shell__eyebrow nao trunca'); console.log('G3_OK')"
  EXPECT: G3_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=0bfc4273b320f03e14e34bfa2b5ef6d79dc9a76d7611258d18443e32b2bd1c80; output-bytes=6

- [x] G4: a TabBar usa position:fixed (não sticky) e respeita a área segura de baixo
  CHECK: node -e "const c=require('fs').readFileSync('src/components/layout/TabBar.css','utf8'); const b=(c.match(/\.tabbar\s*\{[^}]*\}/g)||[]).join(' '); if(!/position:\s*fixed/.test(b)) throw new Error('.tabbar nao e fixed'); if(/position:\s*sticky/.test(b)) throw new Error('.tabbar ainda tem sticky'); if(!/safe-bottom|safe-area-inset-bottom/.test(b)) throw new Error('.tabbar sem area segura inferior'); console.log('G4_OK')"
  EXPECT: G4_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=b8f5e465482816c1bfe95bcea44066b3332753a330cc8df76406aee3cf99109a; output-bytes=6

- [x] G5: o conteúdo reserva espaço inferior para a TabBar fixa (não fica escondido atrás)
  CHECK: node -e "const a=require('fs').readFileSync('src/components/layout/AppShell.css','utf8'); const b=(a.match(/\.shell__content\s*\{[^}]*\}/g)||[]).join(' '); if(!/padding-bottom:\s*calc\([^;]*safe-bottom/.test(b)) throw new Error('.shell__content sem padding-bottom com area segura'); console.log('G5_OK')"
  EXPECT: G5_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=3d5b7ab8be7a5a18bf0bc2e395bb5828a8970dd3f5f4f8278dc6353d48e84023; output-bytes=6

- [x] G6: sem regressão — oxlint limpo, 53 testes passam, build ok
  CHECK: npx oxlint && npm test && npm run build
  EXPECT: 53 passed
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=d2fa896636909cd93eb3ac28eec8ef70f563e73243a24a0618f1a4a786addba4; output-bytes=5856

- [x] G7: verificação renderizada (Chrome DevTools Protocol, 390px) — sem rolagem horizontal, TabBar fixa e colada no rodapé em 5 posições de scroll, data do cabeçalho em 1 linha
  CHECK: node scripts/verifica-mobile.mjs
  EXPECT: MOBILE_LAYOUT_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=04f5baa4965a9c4a5c71a7dfa3e0b3625d5e1c6a961350a6762e8f6878f0fdd6; output-bytes=17
