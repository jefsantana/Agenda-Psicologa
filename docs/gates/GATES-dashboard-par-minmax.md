# Gates: "Atendimentos por convênio" e "Tarefas" não estouram a tela

OWNS: src/pages/DashboardPage.css

Escopo: a usuária mandou print (`Downloads/Capturar.JPG`) mostrando os cards
"Atendimentos por convênio" e "Tarefas" saindo pela direita da tela no celular —
os percentuais/contagens da legenda e o texto das tarefas ficavam cortados na
borda.

Causa (reproduzida via CDP em 360–412px com uma tarefa de nome longo): o bloco
`.dashboard__par`, que agrupa os dois cards, usava `grid-template-columns: 1fr`.
`1fr` é `minmax(auto, 1fr)` — a trilha não encolhe abaixo do `min-content` dos
cards, e a lista de tarefas com nome longo (mesmo com o título em `ellipsis`)
travava a trilha em ~404px. Os dois cards então renderizavam a 404px numa tela
de 390 e o excesso era cortado pelo `overflow-x: hidden` (sem barra de rolagem,
só corte — por isso `documentElement.scrollWidth` não acusava).

Correção: `grid-template-columns: minmax(0, 1fr)` (e `minmax(0, 1fr) minmax(0,
1fr)` na versão de 2 colunas do desktop) + `min-width: 0` em cada card da dupla.
Assim a trilha encolhe e o conteúdo trunca/quebra dentro do card.

Sem escopo: outros grids do app.

---

- [x] G1: `.dashboard__par` usa minmax(0, 1fr) e os cards podem encolher
  CHECK: node -e "const c=require('fs').readFileSync('src/pages/DashboardPage.css','utf8'); const base=(c.match(/\.dashboard__par\s*\{[^}]*\}/)||[''])[0]; if(!/grid-template-columns:\s*minmax\(0,\s*1fr\)/.test(base)) throw new Error('base sem minmax(0,1fr)'); if(!/\.dashboard__par\s*>\s*\*\s*\{\s*min-width:\s*0/.test(c)) throw new Error('cards sem min-width:0'); if(!/min-width:\s*1024px\)\s*\{\s*\.dashboard__par\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(0,\s*1fr\)/.test(c)) throw new Error('desktop sem minmax(0,1fr) x2'); console.log('G1_OK')"
  EXPECT: G1_OK

- [x] G2: sem regressão — oxlint limpo, 53 testes passam, build ok
  CHECK: npx oxlint && npm test && npm run build
  EXPECT: 53 passed

- [x] G3: verificação renderizada a 390px segue ok
  CHECK: node scripts/verifica-mobile.mjs
  EXPECT: MOBILE_LAYOUT_OK

- [x] G4: renderizado 360–430px com tarefa de nome longo + convênios reais — nenhum elemento do dashboard passa da borda
  CHECK: node scripts/verifica-par-dashboard.mjs
  EXPECT: PAR_DASHBOARD_OK
