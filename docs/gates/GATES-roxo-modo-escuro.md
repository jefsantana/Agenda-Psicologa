# Gates: Estender o acento roxo do financeiro ao modo escuro

OWNS: src/styles/tokens.css

Scope: usuário confirmou explicitamente ("as cores e formato das lentras tambem quero que aplique") que queria o mesmo acento roxo do financeiro também no modo escuro — só o claro tinha sido pedido nos dois slices anteriores (69dbdcd e este redesenho de menu). O sistema financeiro nunca troca `--cor-primaria`/`--cor-acento` no bloco `[data-theme="dark"]`: o roxo é constante nos dois temas, só fundo/superfície/texto/borda mudam. Replicado o mesmo princípio no `:root` (bloco escuro-padrão) do tokens.css:

- `--primary`/`--primary-strong`/`--primary-text`/`--primary-soft`/`--primary-rgb`: de azul (#3b82f6 e derivados) para o roxo do financeiro (#7b61ff e derivados — mesmos valores do bloco claro).
- `--gradient-primary`/`--gradient-card` e `--chart-1` seguem o mesmo roxo; `--chart-2` passa a usar o rosa `--cor-acento` do financeiro (#ff7a9c) no lugar do azul claro, já que não fazia mais sentido ao lado do novo roxo.
- Sidebar escura: `--bg-sidebar`, `--bg-nav-active`, `--sidebar-text`, `--sidebar-text-strong`, `--sidebar-border` trocados pelos valores exatos do financeiro em `[data-theme="dark"]` (#14121F / #201C33 / #9691B0 / #FFFFFF / #2B2645).

Fora do escopo: `--danger`/`--danger-text` do escuro continuam com o tom suave atual (#e29cad) — não fazem parte da identidade "financeiro" comparada até aqui (o vermelho do financeiro é #F87171, mais saturado) e não foram mencionados pelo usuário; mudar isso afetaria alertas/erros em todo o app sem pedido explícito. `--bg-app`/`--surface` do conteúdo (fora da sidebar) também não mudaram — só a identidade de cor de destaque e a sidebar, que é o que vinha sendo discutido.

- [x] G1: nenhum resquício do azul antigo nos tokens de acento do escuro
  CHECK: node -e "const t=require('fs').readFileSync('src/styles/tokens.css','utf8'); const raiz=t.slice(0, t.indexOf(':root[data-mode=\"claro\"]')); for (const s of ['#3b82f6','#2f72e0','#6ea8fe','#9cc4ff','59, 130, 246']) if (raiz.includes(s)) throw new Error('sobrou azul: '+s); console.log('SEM_AZUL_OK')"
  EXPECT: SEM_AZUL_OK

- [x] G2: acento roxo do escuro bate com os mesmos valores do financeiro/claro
  CHECK: node -e "const t=require('fs').readFileSync('src/styles/tokens.css','utf8'); const raiz=t.slice(0, t.indexOf(':root[data-mode=\"claro\"]')); for (const s of ['--primary: #7b61ff','--primary-strong: #6a4eea','--primary-rgb: 123, 97, 255']) if (!raiz.includes(s)) throw new Error('faltando: '+s); console.log('ROXO_OK')"
  EXPECT: ROXO_OK

- [x] G3: sidebar escura usa os valores exatos do financeiro em modo escuro
  CHECK: node -e "const t=require('fs').readFileSync('src/styles/tokens.css','utf8'); const raiz=t.slice(0, t.indexOf(':root[data-mode=\"claro\"]')); for (const s of ['--bg-sidebar: #14121f','--bg-nav-active: #201c33','--sidebar-text: #9691b0','--sidebar-text-strong: #ffffff','--sidebar-border: #2b2645']) if (!raiz.includes(s)) throw new Error('faltando: '+s); console.log('SIDEBAR_ESCURA_OK')"
  EXPECT: SIDEBAR_ESCURA_OK

- [x] G4: nenhum componente tem a cor antiga hardcoded por fora do tokens.css (dependência real do token, não cópia solta)
  CHECK: node -e "const {execSync}=require('child_process'); const out=execSync('grep -rl \"#3b82f6\\\\|#2f72e0\\\\|#6ea8fe\\\\|#9cc4ff\" src --include=*.css --include=*.jsx || true').toString().split('\\n').filter(Boolean).filter(f => !f.includes('tokens.css')); if (out.length) throw new Error('hardcoded em: '+out.join(', ')); console.log('SEM_HARDCODE_OK')"
  EXPECT: SEM_HARDCODE_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico

- [x] G5: lint limpo, 53 testes passam, build de produção ok
  CHECK: npx oxlint && npm test && npm run build && echo VERIFICACAO_OK
  EXPECT: VERIFICACAO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
