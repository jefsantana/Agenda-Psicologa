# Gates: "Atendimentos por convênio" e "Tarefas" em coluna única fora do desktop

OWNS: src/pages/DashboardPage.css

Escopo: a usuária relatou que os cards "Atendimentos por convênio" e "Tarefas"
ficavam "jogados para a direita" / desalinhados no celular grande e no tablet.

Causa: `.dashboard__par` (que agrupa esses dois cards) virava 2 colunas já em
`min-width: 640px`, enquanto o resto do dashboard (`.dashboard__grade`,
Calendário) só vira layout de duas colunas em `min-width: 1024px`. Entre 640 e
1024px os dois cards ficavam lado a lado e estreitos, com Agenda e Calendário em
largura cheia acima e abaixo — parecia quebrado.

Correção: `.dashboard__par` passa a dividir em 2 colunas só a partir de 1024px,
junto com o layout de desktop. Abaixo disso é sempre coluna única, alinhada com
os demais cards.

Sem escopo: o layout de desktop (>= 1024px) fica igual.

---

- [x] G1: `.dashboard__par` só tem 2 colunas em >= 1024px (não em 640px)
  CHECK: node -e "const c=require('fs').readFileSync('src/pages/DashboardPage.css','utf8'); if(/min-width:\s*640px\)\s*\{\s*\.dashboard__par/.test(c)) throw new Error('ainda divide em 640px'); if(!/min-width:\s*1024px\)\s*\{\s*\.dashboard__par\s*\{\s*grid-template-columns:\s*1fr 1fr/.test(c)) throw new Error('nao divide em 1024px'); const base=(c.match(/\.dashboard__par\s*\{[^}]*\}/)||[''])[0]; if(!/grid-template-columns:\s*1fr;/.test(base)) throw new Error('base nao e 1 coluna'); console.log('G1_OK')"
  EXPECT: G1_OK

- [x] G2: sem regressão — oxlint limpo, 53 testes passam, build ok
  CHECK: npx oxlint && npm test && npm run build
  EXPECT: 53 passed

- [x] G3: verificação renderizada a 390px segue ok
  CHECK: node scripts/verifica-mobile.mjs
  EXPECT: MOBILE_LAYOUT_OK
