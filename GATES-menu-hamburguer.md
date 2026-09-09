# Gates: navegação do celular só com ☰ + "+"

OWNS: src/components/layout/TabBar.jsx, src/components/layout/TabBar.css,
src/components/layout/MaisMenu.jsx, src/components/layout/MaisMenu.css

Escopo: a pedido da usuária, a barra inferior do celular deixa de ter abas. Fica
com dois botões só:

- **☰** à esquerda — abre a folha "Menu" com **todas** as telas do app (Início,
  Agenda, Pacientes, Financeiro, Prontuários, Atendimentos, Convênios, Relatórios,
  Mensagens, Configurações) em grade de 2 colunas, mais "Sair". A rota atual aparece
  destacada.
- **"+"** no centro, sozinho e elevado — abre "Novo atendimento" (continua ligado ao
  `aoNovoAtendimento` do AppShell).

Isso substitui a v3 (barra de 5 células: 2 links + botão central + 2 links). O botão
central da v3 abria o menu e tinha "Novo atendimento" no topo; agora o "+" faz isso
direto e o menu é só navegação.

Sem escopo: a Sidebar do desktop (a barra só existe abaixo de 1024px), o conteúdo das
telas, o cabeçalho.

---

- [x] G1: a TabBar tem só o ☰ e o "+" (sem NavLink, sem abas)
  CHECK: node -e "const j=require('fs').readFileSync('src/components/layout/TabBar.jsx','utf8'); if(/NavLink/.test(j)) throw new Error('ainda tem NavLink na TabBar'); if(!/tabbar__menu/.test(j)||!/tabbar__acao/.test(j)) throw new Error('faltam ☰ ou +'); if(!/onClick=\{aoNovoAtendimento\}/.test(j)) throw new Error('+ nao chama aoNovoAtendimento'); console.log('G1_OK')"
  EXPECT: G1_OK

- [x] G2: o "+" fica centralizado na barra (posição absoluta em 50%)
  CHECK: node -e "const c=require('fs').readFileSync('src/components/layout/TabBar.css','utf8'); const b=(c.match(/\.tabbar__acao\s*\{[^}]*\}/g)||[]).join(' '); if(!/position:\s*absolute/.test(b)) throw new Error('.tabbar__acao nao e absolute'); if(!/left:\s*50%/.test(b)) throw new Error('.tabbar__acao sem left:50%'); const t=(c.match(/\.tabbar\s*\{[^}]*\}/g)||[]).join(' '); if(/grid-template-columns/.test(t)) throw new Error('.tabbar ainda e grade de abas'); console.log('G2_OK')"
  EXPECT: G2_OK

- [x] G3: o menu lista as 10 telas e é aberto pelo ☰
  CHECK: node -e "const j=require('fs').readFileSync('src/components/layout/MaisMenu.jsx','utf8'); for(const p of ['/hoje','/agenda','/pacientes','/financeiro','/prontuarios','/atendimentos','/convenios','/relatorios','/mensagens','/configuracoes']){ if(!j.includes('\"'+p+'\"')) throw new Error('menu sem '+p); } if(/aoNovoAtendimento/.test(j)) throw new Error('menu ainda tem Novo atendimento'); const t=require('fs').readFileSync('src/components/layout/TabBar.jsx','utf8'); if(!/setMenuAberto\(true\)/.test(t)) throw new Error('☰ nao abre o menu'); console.log('G3_OK')"
  EXPECT: G3_OK

- [x] G4: a TabBar segue opaca (nada vaza por trás)
  CHECK: node -e "const c=require('fs').readFileSync('src/components/layout/TabBar.css','utf8'); const b=(c.match(/\.tabbar\s*\{[^}]*\}/g)||[]).join(' '); if(!/background:\s*var\(--surface-2\)\s*;/.test(b)) throw new Error('.tabbar nao e opaca'); console.log('G4_OK')"
  EXPECT: G4_OK

- [x] G5: sem regressão — oxlint limpo, 53 testes passam, build ok
  CHECK: npx oxlint && npm test && npm run build
  EXPECT: 53 passed

- [x] G6: verificação renderizada a 390px — sem rolagem horizontal, TabBar fixa e colada no rodapé, "+" centralizado, data do cabeçalho em 1 linha
  CHECK: node scripts/verifica-mobile.mjs
  EXPECT: MOBILE_LAYOUT_OK
