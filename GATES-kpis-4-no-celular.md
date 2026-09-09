# Gates: os 4 KPIs do dashboard no celular (2 x 2)

OWNS: src/pages/DashboardPage.jsx, src/pages/DashboardPage.css,
src/components/dashboard/KpiCard.css, src/components/dashboard/DashboardChips.jsx

Escopo: a pedido da usuária, o celular passa a mostrar os **4 KPIs completos** do
dashboard (os mesmos do computador): "Atendimentos hoje", "Próximo atendimento",
"Faltas e remarcações" e "Recebido em <mês>". Layout **2 em cima, 2 embaixo**;
no desktop continua em 4 colunas.

Antes: o celular mostrava 3 "chips" condensados (`DashboardChips`) e escondia os 4
cards abaixo de 1024px. Agora `DashboardChips` sai do dashboard (o componente é
removido; a folha `DashboardChips.css` fica porque `PacienteDetalhePage` e
`ResumoFinanceiro` reaproveitam as classes `.chip*`).

`.kpi` ganha uma regra de celular (`max-width: 640px`): recuos e o número um pouco
menores (25px) para "R$ 12.480" caber em card de ~170px sem encostar na borda.

Sem escopo: o layout de desktop dos KPIs, as classes `.chip*` reaproveitadas.

---

- [x] G1: o dashboard não usa mais DashboardChips; usa DashboardKpis
  CHECK: node -e "const fs=require('fs'); if(fs.existsSync('src/components/dashboard/DashboardChips.jsx')) throw new Error('DashboardChips.jsx ainda existe'); const j=fs.readFileSync('src/pages/DashboardPage.jsx','utf8'); if(/DashboardChips/.test(j)) throw new Error('DashboardPage ainda usa DashboardChips'); if(!/<DashboardKpis/.test(j)) throw new Error('DashboardPage sem DashboardKpis'); console.log('G1_OK')"
  EXPECT: G1_OK

- [x] G2: os 4 KPIs ficam 2 x 2 no celular e 4 colunas no desktop
  CHECK: node -e "const c=require('fs').readFileSync('src/pages/DashboardPage.css','utf8'); const base=(c.match(/\.dashboard__kpis\s*\{[^}]*\}/)||[''])[0]; if(!/display:\s*grid/.test(base)||!/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(base)) throw new Error('base nao e 2 colunas em grid'); if(/\.dashboard__kpis\s*\{\s*display:\s*none/.test(c)) throw new Error('kpis ainda escondidos no mobile'); if(!/min-width:\s*1024px\)\s*\{\s*\.dashboard__kpis\s*\{\s*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/.test(c)) throw new Error('desktop nao e 4 colunas'); console.log('G2_OK')"
  EXPECT: G2_OK

- [x] G3: KpiCard tem afinação de celular para o número não estourar
  CHECK: node -e "const c=require('fs').readFileSync('src/components/dashboard/KpiCard.css','utf8'); if(!/max-width:\s*640px\)[\s\S]*\.kpi__valor\s*\{\s*font-size:\s*25px/.test(c)) throw new Error('sem regra de celular no .kpi__valor'); console.log('G3_OK')"
  EXPECT: G3_OK

- [x] G4: sem regressão — oxlint limpo, 53 testes passam, build ok
  CHECK: npx oxlint && npm test && npm run build
  EXPECT: 53 passed

- [x] G5: renderizado — 4 KPIs 2 x 2, nada estoura a borda, verificações de mobile ok
  CHECK: node scripts/verifica-mobile.mjs && node scripts/verifica-par-dashboard.mjs
  EXPECT: PAR_DASHBOARD_OK
