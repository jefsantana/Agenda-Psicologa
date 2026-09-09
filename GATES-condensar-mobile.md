# Gates: dashboard mais curto no celular (convênio, calendário, lembrete)

OWNS: src/pages/DashboardPage.jsx, src/pages/DashboardPage.css,
src/components/dashboard/DonutConvenios.jsx, src/components/dashboard/DonutConvenios.css,
src/components/dashboard/CalendarioMes.jsx, src/components/dashboard/CalendarioMes.css,
scripts/verifica-condensar-mobile.mjs

Escopo: três ajustes de densidade no dashboard do celular, pedidos pela usuária a
partir do print (`Downloads/iPhone-14-PRO-jefsantana.github.io.png`):

1. **"Atendimentos por convênio"** — a lista por convênio (4 linhas) começa
   recolhida no celular, atrás de um botão "Ver por convênio (N)". No desktop
   aparece sempre e o botão some.
2. **Calendário do dashboard** — recolhido por padrão no celular (mostra só o mês,
   os controles de mês e um resumo "N dias com sessão em <mês>"), com botão de
   abrir/fechar que grava a escolha em `localStorage` (`dashboard:calendario-aberto`).
   No desktop fica sempre aberto e o botão/resumo somem. O `CalendarioMes` da
   página **Agenda** não é afetado (a prop `recolhivel` só é passada no dashboard).
3. **Lembrete de pendências** — a ação "resolva na Agenda" (link sublinhado no
   meio do texto) vira um botão "Resolver na Agenda" com alvo de toque.

Sem escopo: o layout de desktop, a página Agenda, as demais seções do dashboard.

Controle negativo do checker: `scripts/verifica-condensar-mobile.mjs` pegou uma
regressão real durante o desenvolvimento (o botão de recolher o calendário não
sumia no desktop por especificidade de CSS) e passou a `CONDENSAR_MOBILE_OK` só
depois da correção — ou seja, ele falha quando deve.

---

- [x] G1: comportamento renderizado dos 3 itens (celular recolhido, desktop aberto, lembrete = botão)
  CHECK: node scripts/verifica-condensar-mobile.mjs
  EXPECT: CONDENSAR_MOBILE_OK
  EVIDENCE: CONDENSAR_MOBILE_OK; exit=0; shell=git-bash; cwd=repo root

- [x] G2: a página Agenda não herda o calendário recolhível
  CHECK: node -e "const s=require('fs').readFileSync('src/components/agenda/SeletorDataAgenda.jsx','utf8'); if(/recolhivel/.test(s)) throw new Error('SeletorDataAgenda passa recolhivel'); const j=require('fs').readFileSync('src/components/dashboard/CalendarioMes.jsx','utf8'); if(!/recolhivel = false/.test(j)) throw new Error('prop recolhivel nao tem default false'); const d=require('fs').readFileSync('src/pages/DashboardPage.jsx','utf8'); if(!/<CalendarioMes[\s\S]*?recolhivel[\s\S]*?\/>/.test(d)) throw new Error('DashboardPage nao passa recolhivel'); console.log('G2_OK')"
  EXPECT: G2_OK
  EVIDENCE: G2_OK; exit=0

- [x] G3: sem regressão — oxlint limpo, 53 testes passam, build ok
  CHECK: npx oxlint && npm test && npm run build
  EXPECT: 53 passed
  EVIDENCE: oxlint exit=0; 53 passed; vite build ok

- [x] G4: as verificações de layout do dashboard continuam passando
  CHECK: node scripts/verifica-mobile.mjs && node scripts/verifica-par-dashboard.mjs
  EXPECT: PAR_DASHBOARD_OK
  EVIDENCE: MOBILE_LAYOUT_OK; PAR_DASHBOARD_OK; exit=0
