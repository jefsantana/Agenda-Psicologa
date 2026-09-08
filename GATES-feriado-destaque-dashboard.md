# Gates: Destaque de feriado no Dashboard (banner + chip na Agenda do dia)

OWNS: src/pages/DashboardPage.jsx, src/pages/DashboardPage.css, src/components/dashboard/AgendaDoDia.jsx, src/components/dashboard/AgendaDoDia.css

Scope: além da marca no calendário, o feriado do dia selecionado passa a aparecer no corpo do Dashboard de dois jeitos: (1) um banner informativo no topo — "Hoje é feriado: Natal." quando o dia é hoje, ou "25 de dezembro é feriado: Natal." para outro dia selecionado; (2) um chip "Feriado · Natal" no cabeçalho do bloco "Agenda do dia". Ambos usam `feriadoEm(paraISO(dataSelecionada|data))` — nenhuma consulta nova. Fora do escopo: eyebrow do topo, tela de Agenda, bloquear ações.

- [x] G1: o banner de feriado existe no DashboardPage e usa feriadoEm sobre o dia selecionado
  CHECK: node -e "const c=require('fs').readFileSync('src/pages/DashboardPage.jsx','utf8'); if(!/feriadoEm\(paraISO\(dataSelecionada\)\)/.test(c)||!/dashboard__feriado/.test(c)||!/Hoje é feriado/.test(c)) throw new Error('banner ausente'); console.log('BANNER_OK')"
  EXPECT: BANNER_OK

- [x] G2: o chip de feriado existe no cabeçalho da Agenda do dia
  CHECK: node -e "const c=require('fs').readFileSync('src/components/dashboard/AgendaDoDia.jsx','utf8'); if(!/feriadoEm\(paraISO\(data\)\)/.test(c)||!/agenda-dia__feriado/.test(c)) throw new Error('chip ausente'); console.log('CHIP_OK')"
  EXPECT: CHIP_OK

- [x] G3: os estilos novos existem nos CSS do escopo
  CHECK: node -e "const fs=require('fs'); if(!/\.dashboard__feriado\b/.test(fs.readFileSync('src/pages/DashboardPage.css','utf8'))) throw new Error('css dashboard'); if(!/\.agenda-dia__feriado\b/.test(fs.readFileSync('src/components/dashboard/AgendaDoDia.css','utf8'))) throw new Error('css agenda'); console.log('CSS_OK')"
  EXPECT: CSS_OK

- [x] G4: lint limpo no escopo + suíte inteira verde + build
  CHECK: npx oxlint src/pages/DashboardPage.jsx src/components/dashboard/AgendaDoDia.jsx && npm test && npm run build
  EXPECT: built in
