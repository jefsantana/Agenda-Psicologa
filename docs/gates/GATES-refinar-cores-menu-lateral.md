# Gates: Refinar cor/tamanho/forma das letras do menu lateral (financeiro)

OWNS: src/styles/tokens.css, src/components/layout/Sidebar.css

Scope: usuário mandou um print recortado só do sidebar do financeiro (modo escuro, bem mais nítido que o print de tela cheia usado no slice anterior) pedindo pra melhorar cor/tamanho/forma das letras do menu lateral da Agenda também. Comparando lado a lado, achei 2 diferenças reais:

1. Item ativo ("Dashboard") no financeiro é uma pílula cheia com a cor `--primary` vívida (roxo saturado) e ícone branco — o da Agenda usava `--bg-nav-active` (um azul-marinho escuro e discreto) mais uma barrinha lateral de destaque, o que ficava esmaecido perto do financeiro.
2. Rótulo de grupo ("PRINCIPAL", "GESTÃO"...) usava `opacity: 0.7` em cima de `--sidebar-text` pra ficar mais discreto — viola a própria regra documentada no topo do tokens.css ("cores sólidas com contraste verificado, não opacidade, que varia com o fundo"). Trocado por um token novo `--sidebar-text-faint`, cor sólida definida nos dois modos.

De caminho, removido `--accent-soft-icon` (token que só existia pra colorir o ícone do item ativo na versão antiga — não faz mais sentido com o ícone branco herdando de `color: #fff` da pílula cheia).

Tamanho da letra dos itens subiu de 13.5px para 14px (o financeiro usa 14px) pra bater com a referência.

Fora do escopo: modo escuro da Agenda continua com o azul (`--primary: #3b82f6`) como no slice anterior (69dbdcd) — só o modo claro foi pedido pra espelhar o financeiro, o usuário não pediu pra estender ao escuro.

- [x] G1: item ativo do menu usa a cor primária vívida cheia, sem a barra lateral antiga nem override de cor no ícone
  CHECK: node -e "const c=require('fs').readFileSync('src/components/layout/Sidebar.css','utf8'); if(!/\.sidebar__item--ativo\s*{[^}]*background:\s*var\(--primary\)/.test(c)) throw new Error('pilula ativa nao usa --primary'); if(c.includes('accent-soft-icon')) throw new Error('ainda referencia accent-soft-icon'); if(/sidebar__item--ativo::before/.test(c)) throw new Error('barra lateral antiga ainda presente'); console.log('ATIVO_OK')"
  EXPECT: ATIVO_OK

- [x] G2: rótulo de grupo usa cor sólida dedicada (--sidebar-text-faint), sem opacity
  CHECK: node -e "const c=require('fs').readFileSync('src/components/layout/Sidebar.css','utf8'); if(!c.includes('.sidebar__grupo-titulo')) throw new Error('sem regra de grupo-titulo'); if(/\.sidebar__grupo-titulo\s*{[^}]*opacity/.test(c)) throw new Error('ainda usa opacity'); if(!c.includes('var(--sidebar-text-faint)')) throw new Error('nao usa o token novo'); const t=require('fs').readFileSync('src/styles/tokens.css','utf8'); if(!t.includes('--sidebar-text-faint')) throw new Error('token nao definido'); console.log('GRUPO_OK')"
  EXPECT: GRUPO_OK

- [x] G3: token órfão --accent-soft-icon removido de tokens.css (claro e escuro)
  CHECK: node -e "const t=require('fs').readFileSync('src/styles/tokens.css','utf8'); if(t.includes('accent-soft-icon')) throw new Error('token ainda presente'); console.log('SEM_ORFAO_OK')"
  EXPECT: SEM_ORFAO_OK

- [x] G4: lint limpo, 53 testes passam, build de produção ok
  CHECK: npx oxlint && npm test && npm run build && echo VERIFICACAO_OK
  EXPECT: VERIFICACAO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
