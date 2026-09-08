# Gates: Auditoria de responsividade no celular

OWNS: (auditoria — sem alteração de código nesta fatia; correções entram em fatias seguintes)

Scope: verificar se o sistema se adapta a telas de celular. Esta fatia é o **diagnóstico**: revisão estática do `<meta viewport>`, da estratégia de breakpoints e dos padrões de layout de cada tela, registrando o que está OK e o que precisa de correção. As correções em si entram em fatias próprias depois, priorizadas pelo que a usuária apontar.

## Resultado da revisão estática (2026-09-08, branch `audit/responsividade-mobile`)

O app é **mobile-first e foi construído com cuidado para o celular**. A revisão do
CSS não sustenta um "não está adaptável" geral — o esperado é que o problema
relatado seja **uma tela específica** ou um efeito de cache/versão. Pontos:

### OK (confirmado no código)

- `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">` presente.
- `body { overflow-x: hidden }` + `min-width: 0` nos filhos flex em toda parte — trava o scroll horizontal.
- `100dvh` (não `100vh`) no shell, sidebar e login — sem o bug da barra do navegador móvel.
- `Sidebar` escondida abaixo de 1024px; `TabBar` (pílula flutuante) só abaixo de 1024px, com `--safe-bottom` para o notch.
- Alvo de toque ≥ 44px na TabBar, no botão "+" central e nos botões da lista do Financeiro.
- Tabela de Atendimentos vira cartões de 2 colunas no celular, dentro de wrapper `overflow-x: auto`.
- Abas horizontais (`AbasHorizontais`, prontuário) com `overflow-x: auto` + `white-space: nowrap`.
- KPIs do Financeiro viram uma tira compacta de 3 colunas no celular, de propósito.
- `prefers-reduced-motion` e `:focus-visible` tratados globalmente.

### A confirmar no dispositivo / pontos de atenção

- **G-A1** `TabBar` usa `repeat(6, 1fr)` — 5 itens + botão central. Em telas de ~320px os rótulos (`--fs-2xs`) podem ficar apertados. Confirmar em iPhone SE / Android pequeno.
- **G-A2** `ResumoFinanceiro.css` e `PacienteDetalhePage.css`: `.resumo-fin__chips` / `.paciente-detalhe__chips` usam `repeat(3, 1fr)` **sem** breakpoint de fallback. 3 chips em ~330px ≈ 106px cada — confirmar se o conteúdo cabe.
- **G-A3** `RelatoriosPage` KPIs: `repeat(4,1fr)` → `repeat(2,1fr)` só abaixo de 900px; sem passo extra para telas muito estreitas com valores grandes ("R$ 12.345").
- **G-A4** Vários `white-space: nowrap` em nomes/valores — protegidos por `min-width: 0` + `text-overflow: ellipsis` nos casos vistos, mas confirmar nas linhas com muitos elementos fixos (Financeiro `fin-linha__acoes`, worklist).
- **G-A5** Página de **Configurações** (nova seção "Feriados e recessos") e telas de **Sessão**, **Mensagens**, **Convênios** ainda não revisadas linha a linha.

## Gates

- [x] G1: o `<meta viewport>` está presente e correto
  CHECK: node -e "const c=require('fs').readFileSync('index.html','utf8'); if(!/name=\"viewport\"[^>]*width=device-width/.test(c)) throw new Error('viewport ausente'); console.log('VIEWPORT_OK')"
  EXPECT: VIEWPORT_OK

- [x] G2: nenhuma tela usa `100vh` (apenas `100dvh`), evitando o corte pela barra do navegador móvel
  CHECK: node -e "const {execSync}=require('child_process'); const r=execSync('grep -rn \"100vh\" src/ || true').toString().trim(); if(r) throw new Error('uso de 100vh:\n'+r); console.log('SEM_100VH_OK')"
  EXPECT: SEM_100VH_OK

- [x] G3: o `body` trava o scroll horizontal
  CHECK: node -e "const c=require('fs').readFileSync('src/index.css','utf8'); if(!/overflow-x:\s*hidden/.test(c)) throw new Error('body sem overflow-x hidden'); console.log('OVERFLOW_OK')"
  EXPECT: OVERFLOW_OK

- [x] G4: conteúdo largo (tabela de atendimentos, abas do prontuário) está em contêiner com rolagem própria
  CHECK: node -e "const fs=require('fs'); const a=fs.readFileSync('src/pages/AtendimentosPage.css','utf8'); const b=fs.readFileSync('src/components/ui/AbasHorizontais.css','utf8'); if(!/\.atd-tabela\s*\{[^}]*overflow-x:\s*auto/s.test(a)) throw new Error('tabela de atendimentos sem wrapper de rolagem'); if(!/overflow-x:\s*auto/.test(b)) throw new Error('abas horizontais sem rolagem'); console.log('WRAP_OK')"
  EXPECT: WRAP_OK

- [x] G5: a navegação alterna por breakpoint (Sidebar escondida por padrão e mostrada só ≥1024; TabBar escondida ≥1024)
  CHECK: node -e "const fs=require('fs'); const s=fs.readFileSync('src/components/layout/Sidebar.css','utf8'); const t=fs.readFileSync('src/components/layout/TabBar.css','utf8'); const sOk=/\.sidebar\s*\{\s*display:\s*none/s.test(s) && /@media\s*\(min-width:\s*1024px\)/.test(s) && /display:\s*flex/.test(s); const tOk=/@media\s*\(min-width:\s*1024px\)/.test(t) && /\.tabbar\s*\{\s*display:\s*none/s.test(t); if(!sOk) throw new Error('sidebar'); if(!tOk) throw new Error('tabbar'); console.log('NAV_OK')"
  EXPECT: NAV_OK
