# Gates: Correção do sistema de cor de destaque (Configurações → Aparência)

OWNS: src/lib/tema.js, src/styles/tokens.css

Scope: durante a revisão de Configurações, dois bugs reais foram encontrados no seletor "Cor de destaque" (resquício da migração v6→v7): (1) a opção "Lavanda" aparecia marcada como padrão mas não tinha definição própria de `--primary` no tema escuro — caía silenciosamente no azul do handoff v7, tornando-a indistinguível de "Azul"; (2) no tema claro, NENHUMA cor de destaque (Azul/Rosa/Verde) tinha efeito — o bloco `:root[data-mode="claro"]` redefinia `--primary` para roxo com a mesma especificidade, e por vir depois no arquivo sempre vencia. Confirmado com o usuário antes de agir: (1) remover "Lavanda" da lista, (2) corrigir o bug do tema claro.

- [x] G1: "Lavanda" removida da lista de acentos selecionáveis
  CHECK: node -e "const s=require('fs').readFileSync('src/lib/tema.js','utf8'); if(/id: \"padrao\"/.test(s)) throw new Error('Lavanda/padrao ainda na lista ACENTOS'); console.log('LAVANDA_REMOVIDA_OK')"
  EXPECT: LAVANDA_REMOVIDA_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=LAVANDA_REMOVIDA_OK

- [x] G2: Quem tinha "padrao" ou "roxo" salvo no localStorage migra para "azul" (sem acento inválido/vazio)
  CHECK: node -e "const s=require('fs').readFileSync('src/lib/tema.js','utf8'); if(!/salvo === \"roxo\" \|\| salvo === \"padrao\"/.test(s)) throw new Error('migracao ausente'); if(!/return \"azul\"/.test(s)) throw new Error('fallback nao aponta para azul'); console.log('MIGRACAO_OK')"
  EXPECT: MIGRACAO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=MIGRACAO_OK

- [x] G3: Tema claro tem blocos de acento próprios com especificidade maior que o bloco base claro (2 atributos vs. 1), garantindo que vençam independentemente da ordem
  CHECK: node -e "const s=require('fs').readFileSync('src/styles/tokens.css','utf8'); for(const t of ['[data-mode=\"claro\"][data-accent=\"azul\"]','[data-mode=\"claro\"][data-accent=\"rosa\"]','[data-mode=\"claro\"][data-accent=\"verde\"]']) if(!s.includes(t)) throw new Error('faltando bloco: '+t); console.log('ACENTO_CLARO_OK')"
  EXPECT: ACENTO_CLARO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=ACENTO_CLARO_OK

- [x] G4: Lint limpo no projeto inteiro
  CHECK: npx oxlint . && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output includes LINT_OK

- [x] G5: Confirmação visual ao vivo — acento realmente muda a cor no claro e no escuro, sem sobra de "Lavanda"
  EVIDENCE: navegador autenticado, /configuracoes. Escuro: seletor mostra só Azul/Rosa/Verde, Azul ativo por padrão (sem Lavanda). Claro + Azul: botão "Salvar" e indicadores de foco em azul (antes eram roxo). Claro + Rosa: botão "Salvar", checkbox ativo, indicador da sidebar e anéis de foco mudaram para rosa real — confirmando que o bug de cascata foi corrigido. Restaurado para Escuro + Azul ao final do teste.
