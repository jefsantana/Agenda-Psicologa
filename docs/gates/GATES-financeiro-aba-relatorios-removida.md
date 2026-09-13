# Gates: Remoção da aba "Relatórios" duplicada dentro do Financeiro

OWNS: src/pages/FinanceiroPage.jsx

Scope: durante o teste ponta a ponta, a aba interna "Relatórios" do Financeiro ainda mostrava a mensagem antiga "ainda não foram construídos", mas essa funcionalidade (fechamento do mês + por convênio) já existe na página real `/relatorios` do menu lateral. Manter as duas criava uma contradição visível (uma diz "não construído", a outra mostra dados reais). Removida a aba redundante do Financeiro; `/relatorios` continua sendo o único lugar para isso.

- [x] G1: Aba "relatorios" e sua mensagem de placeholder removidas do Financeiro
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/FinanceiroPage.jsx','utf8'); if(/id: \"relatorios\"/.test(s)) throw new Error('aba relatorios ainda existe'); if(/ainda não foram construídos/.test(s)) throw new Error('mensagem antiga ainda presente'); console.log('ABA_REMOVIDA_OK')"
  EXPECT: ABA_REMOVIDA_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=ABA_REMOVIDA_OK

- [x] G2: Lint limpo no projeto inteiro
  CHECK: npx oxlint . && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output includes LINT_OK

- [x] G3: Confirmação visual ao vivo — Financeiro agora só tem Resumo/Lançamentos, ambos funcionando
  EVIDENCE: navegador autenticado, /financeiro (após reload completo — um teste anterior sem reload mostrou tela em branco por estado obsoleto do Vite HMR, não um bug real; confirmado ausente após F5). Abas mostram só "Resumo" e "Lançamentos". "Resumo" carrega com dados reais (Recebido em setembro R$740 etc.), "Lançamentos" também.
