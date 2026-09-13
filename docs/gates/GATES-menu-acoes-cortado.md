# Gates: Menu "⋮" da Agenda do dia não fica mais cortado

OWNS: src/components/dashboard/AgendaDoDia.css

Scope: ao clicar em "⋮" numa linha da "Agenda do dia" (Dashboard), o dropdown "Editar/Excluir" abria por baixo do botão, mas o card `.agenda-dia` tinha `overflow: hidden`, cortando o menu — "Editar" aparecia só parcialmente e "Excluir" nem aparecia. Reproduzido ao vivo e corrigido removendo o `overflow: hidden` do card (desnecessário: nenhum elemento interno toca as bordas sem padding, então as bordas arredondadas continuam certas sem ele).

- [x] G1: `.agenda-dia` não tem mais `overflow: hidden`
  CHECK: node -e "const s=require('fs').readFileSync('src/components/dashboard/AgendaDoDia.css','utf8'); const m=s.match(/\.agenda-dia\s*{[^}]*}/); if(!m) throw new Error('regra .agenda-dia nao encontrada'); if(/overflow:\s*hidden/.test(m[0])) throw new Error('ainda corta o menu'); console.log('OVERFLOW_REMOVIDO_OK')"
  EXPECT: OVERFLOW_REMOVIDO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=OVERFLOW_REMOVIDO_OK

- [x] G2: Lint limpo no projeto inteiro
  CHECK: npx oxlint . && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output includes LINT_OK

- [x] G3: Confirmação visual ao vivo — "Editar" e "Excluir" aparecem inteiros e clicáveis, sem corte
  EVIDENCE: navegador autenticado, /hoje. Antes da correção: cliquei "⋮" na linha do atendimento e só a parte de cima da palavra "Editar" aparecia, cortada pela borda do card; "Excluir" não aparecia. Depois da correção (reload): mesmo clique mostrou o menu completo com "Editar" e "Excluir" totalmente visíveis, sobrepondo o card "Atendimentos por convênio" abaixo (comportamento esperado de um dropdown). Bordas arredondadas do card "Agenda do dia" continuam normais.
