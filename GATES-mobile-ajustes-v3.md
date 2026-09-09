# Gates: ajustes de mobile v3 (TabBar, tipografia, linhas de ação)

OWNS: src/components/layout/TabBar.jsx, src/components/layout/TabBar.css,
src/components/layout/MaisMenu.jsx, src/components/layout/MaisMenu.css,
src/components/layout/AppShell.css, src/components/dashboard/DashboardChips.css,
src/pages/DashboardPage.css, src/pages/PacientesPage.css, src/pages/RelatoriosPage.css,
scripts/verifica-mobile.mjs

Escopo: quatro queixas da usuária ao abrir o app no celular (foto `Downloads/20635.jpg`),
confirmadas em render a 390px via Chrome DevTools Protocol:

1. **Botão central da TabBar deslocado para a esquerda** — a barra era uma grade de
   6 colunas iguais com 2 itens à esquerda e 3 à direita (Início, Agenda | + |
   Pacientes, Financeiro, Mais); o "+" caía na 3ª de 6, a ~42% da largura. Agora são
   5 células (2 links + botão central + 2 links) e o botão central fica no meio real.
   O item "Mais" isolado sai da barra: o botão central abre a folha "Mais", que passa a
   ter **"Novo atendimento"** em destaque no topo, seguido das telas secundárias.
2. **"Telas cortando"** — a TabBar e o cabeçalho eram translúcidos (78% / 92%); o
   conteúdo rolava visível atrás deles e a última linha de cada tela parecia cortada.
   TabBar agora é opaca (`var(--surface-2)`), cabeçalho a 97%, e o
   `padding-bottom` do conteúdo sobe de 96px para 112px para o último card não ficar
   sob a barra em aparelhos com barra de gestos.
3. **Letras muito pequenas** — eyebrow e rótulos da TabBar de 11px para 12px, apoio
   dos chips de 10,5px para 11,5px (e sem truncar), subtítulo de tela de 13px para
   14px. Os 3 chips do topo passam a 2 colunas no celular (o 3º ocupa a linha toda);
   a partir de 560px voltam a 3.
4. **Botões desalinhados nas linhas de ação** — no celular (`max-width` 600px em
   Pacientes, 560px em Relatórios) a busca + "Novo paciente" e o seletor de mês +
   "Exportar PDF" empilham, cada um na largura toda.

Também: `scripts/verifica-mobile.mjs` roda o Chrome com `--disable-features=ServiceWorker`
(o service worker do PWA servia o bundle antigo do mesmo `user-data-dir` e a
verificação testava código velho) e ganha uma checagem nova de que o botão central da
TabBar está centralizado.

Sem escopo: telas de Prontuário/Sessão, o gráfico de convênios com dados reais, ícones
PNG do PWA, o "site para computador" do navegador.

---

- [x] G1: TabBar tem 5 células e nenhum item "Mais" isolado (é o botão central que abre o menu)
  CHECK: node -e "const j=require('fs').readFileSync('src/components/layout/TabBar.jsx','utf8'); if(/setMaisAberto/.test(j)) throw new Error('ainda tem botao Mais isolado'); if(!/setMenuAberto/.test(j)) throw new Error('sem botao central que abre menu'); const c=require('fs').readFileSync('src/components/layout/TabBar.css','utf8'); const b=(c.match(/\.tabbar\s*\{[^}]*\}/g)||[]).join(' '); if(!/grid-template-columns:\s*repeat\(5,\s*1fr\)/.test(b)) throw new Error('grade nao e repeat(5, 1fr)'); console.log('G1_OK')"
  EXPECT: G1_OK

- [x] G2: a folha "Mais" recebe aoNovoAtendimento e mostra o botão "Novo atendimento" no topo
  CHECK: node -e "const j=require('fs').readFileSync('src/components/layout/MaisMenu.jsx','utf8'); if(!/aoNovoAtendimento/.test(j)) throw new Error('MaisMenu sem prop aoNovoAtendimento'); if(!/mais-menu__novo/.test(j)) throw new Error('sem botao Novo atendimento'); const t=require('fs').readFileSync('src/components/layout/TabBar.jsx','utf8'); if(!/aoNovoAtendimento=\{aoNovoAtendimento\}/.test(t)) throw new Error('TabBar nao repassa aoNovoAtendimento'); console.log('G2_OK')"
  EXPECT: G2_OK

- [x] G3: TabBar opaca e cabeçalho quase opaco (fim do vazamento de conteúdo atrás)
  CHECK: node -e "const c=require('fs').readFileSync('src/components/layout/TabBar.css','utf8'); const b=(c.match(/\.tabbar\s*\{[^}]*\}/g)||[]).join(' '); if(!/background:\s*var\(--surface-2\)\s*;/.test(b)) throw new Error('.tabbar nao e opaca'); const a=require('fs').readFileSync('src/components/layout/AppShell.css','utf8'); const h=(a.match(/\.shell__header\s*\{[^}]*\}/g)||[]).join(' '); const m=h.match(/bg-app-mobile\)\s*(\d+)%/); if(!m||Number(m[1])<96) throw new Error('.shell__header ainda muito translucido'); console.log('G3_OK')"
  EXPECT: G3_OK

- [x] G4: o conteúdo reserva >= 112px embaixo para a TabBar
  CHECK: node -e "const a=require('fs').readFileSync('src/components/layout/AppShell.css','utf8'); const b=(a.match(/\.shell__content\s*\{[^}]*\}/g)||[]).join(' '); const m=b.match(/padding-bottom:\s*calc\((\d+)px/); if(!m||Number(m[1])<112) throw new Error('padding-bottom do conteudo < 112px'); console.log('G4_OK')"
  EXPECT: G4_OK

- [x] G5: tipografia do mobile subiu (eyebrow/tab 12px, apoio do chip 11,5px, subtítulo 14px)
  CHECK: node -e "const fs=require('fs'); const a=fs.readFileSync('src/components/layout/AppShell.css','utf8'); if(!/\.shell__eyebrow\s*\{[^}]*font-size:\s*12px/.test(a)) throw new Error('eyebrow != 12px'); if(!/\.shell__subtitle\s*\{[^}]*font-size:\s*14px/.test(a)) throw new Error('subtitle != 14px'); const t=fs.readFileSync('src/components/layout/TabBar.css','utf8'); if(!/\.tabbar__item\s*\{[^}]*font-size:\s*12px/.test(t)) throw new Error('tabbar__item != 12px'); const d=fs.readFileSync('src/components/dashboard/DashboardChips.css','utf8'); if(!/\.chip__apoio\s*\{[^}]*font-size:\s*11\.5px/.test(d)) throw new Error('chip__apoio != 11.5px'); console.log('G5_OK')"
  EXPECT: G5_OK

- [x] G6: chips do dashboard em 2 colunas no celular, 3 a partir de 560px
  CHECK: node -e "const c=require('fs').readFileSync('src/pages/DashboardPage.css','utf8'); const base=(c.match(/\.dashboard__chips\s*\{[^}]*\}/)||[''])[0]; if(!/grid-template-columns:\s*repeat\(2,\s*1fr\)/.test(base)) throw new Error('chips nao comecam em 2 colunas'); if(!/min-width:\s*560px[^}]*\{[\s\S]*?repeat\(3,\s*1fr\)/.test(c)) throw new Error('sem volta para 3 colunas em 560px'); console.log('G6_OK')"
  EXPECT: G6_OK

- [x] G7: linhas de ação de Pacientes e Relatórios empilham no celular
  CHECK: node -e "const fs=require('fs'); const p=fs.readFileSync('src/pages/PacientesPage.css','utf8'); if(!/max-width:\s*600px\)\s*\{\s*\.pacientes-toolbar\s*\{\s*flex-direction:\s*column/.test(p)) throw new Error('pacientes-toolbar nao empilha'); const r=fs.readFileSync('src/pages/RelatoriosPage.css','utf8'); if(!/max-width:\s*560px\)\s*\{\s*\.relatorios-topo\s*\{\s*flex-direction:\s*column/.test(r)) throw new Error('relatorios-topo nao empilha'); console.log('G7_OK')"
  EXPECT: G7_OK

- [x] G8: sem regressão — oxlint limpo, 53 testes passam, build ok
  CHECK: npx oxlint && npm test && npm run build
  EXPECT: 53 passed

- [x] G9: verificação renderizada a 390px — sem rolagem horizontal, TabBar fixa e colada no rodapé, botão central centralizado, data do cabeçalho em 1 linha
  CHECK: node scripts/verifica-mobile.mjs
  EXPECT: MOBILE_LAYOUT_OK
