# Gates: navegação do celular só com ☰ no cabeçalho

OWNS: src/components/layout/AppShell.jsx, src/components/layout/AppShell.css,
src/components/layout/MaisMenu.jsx, src/components/layout/MaisMenu.css,
src/components/layout/TabBar.jsx, src/components/layout/TabBar.css,
scripts/verifica-mobile.mjs

Escopo: a pedido da usuária, sai a barra inferior flutuante inteira (☰ + "+"). No
celular fica só um **☰ no cabeçalho**, à esquerda, antes do título. Ele abre a folha
"Menu" com:

- **"Novo atendimento"** em destaque no topo (ligado ao `aoNovoAtendimento`, agora
  disparado pelo próprio AppShell);
- as 10 telas em grade de 2 colunas (Início, Agenda, Pacientes, Financeiro,
  Prontuários, Atendimentos, Convênios, Relatórios, Mensagens, Configurações);
- "Sair".

O avatar de iniciais do cabeçalho mobile sai (o ☰ toma o lugar dele; dois elementos
redondos lado a lado eram redundantes e espremiam a data). O `padding-bottom` do
conteúdo volta ao respiro normal (não há mais barra a reservar espaço). No desktop
nada muda: a Sidebar continua sendo a navegação e o ☰ some (`min-width: 1024px`).

`TabBar.jsx`/`TabBar.css` são removidos. `scripts/verifica-mobile.mjs` deixa de checar
a TabBar e passa a conferir o ☰ do cabeçalho; usa `user-data-dir` novo a cada
execução para nunca renderizar bundle velho pelo service worker.

Sem escopo: Sidebar do desktop, conteúdo das telas.

---

- [x] G1: não existe mais TabBar
  CHECK: node -e "const fs=require('fs'); if(fs.existsSync('src/components/layout/TabBar.jsx')||fs.existsSync('src/components/layout/TabBar.css')) throw new Error('TabBar ainda existe'); const a=fs.readFileSync('src/components/layout/AppShell.jsx','utf8'); if(/TabBar/.test(a)) throw new Error('AppShell ainda importa/usa TabBar'); console.log('G1_OK')"
  EXPECT: G1_OK

- [x] G2: o ☰ vive no cabeçalho e abre o menu
  CHECK: node -e "const a=require('fs').readFileSync('src/components/layout/AppShell.jsx','utf8'); if(!/shell__header-left[\s\S]*shell__menu-botao/.test(a)) throw new Error('☰ nao esta no header-left'); if(!/setMenuAberto\(true\)/.test(a)) throw new Error('☰ nao abre o menu'); if(!/<MaisMenu[\s\S]*aoNovoAtendimento=\{/.test(a)) throw new Error('MaisMenu sem aoNovoAtendimento'); console.log('G2_OK')"
  EXPECT: G2_OK

- [x] G3: o ☰ some no desktop (a Sidebar assume)
  CHECK: node -e "const c=require('fs').readFileSync('src/components/layout/AppShell.css','utf8'); if(!/min-width:\s*1024px\)\s*\{\s*\.shell__menu-botao\s*\{\s*display:\s*none/.test(c)) throw new Error('☰ nao some no desktop'); console.log('G3_OK')"
  EXPECT: G3_OK

- [x] G4: o menu tem "Novo atendimento" e as 10 telas
  CHECK: node -e "const j=require('fs').readFileSync('src/components/layout/MaisMenu.jsx','utf8'); if(!/mais-menu__novo/.test(j)) throw new Error('sem Novo atendimento'); for(const p of ['/hoje','/agenda','/pacientes','/financeiro','/prontuarios','/atendimentos','/convenios','/relatorios','/mensagens','/configuracoes']){ if(!j.includes('\"'+p+'\"')) throw new Error('menu sem '+p); } console.log('G4_OK')"
  EXPECT: G4_OK

- [x] G5: o conteúdo não reserva mais espaço de barra inferior
  CHECK: node -e "const a=require('fs').readFileSync('src/components/layout/AppShell.css','utf8'); const b=(a.match(/\.shell__content\s*\{[^}]*\}/g)||[]).join(' '); if(/padding-bottom:\s*calc\(\d{3}px/.test(b)) throw new Error('ainda reserva ~100px+ embaixo'); console.log('G5_OK')"
  EXPECT: G5_OK

- [x] G6: sem regressão — oxlint limpo, 53 testes passam, build ok
  CHECK: npx oxlint && npm test && npm run build
  EXPECT: 53 passed

- [x] G7: verificação renderizada a 390px — sem rolagem horizontal, ☰ no cabeçalho com alvo de toque, data em 1 linha
  CHECK: node scripts/verifica-mobile.mjs
  EXPECT: MOBILE_LAYOUT_OK
