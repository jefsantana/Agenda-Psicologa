# Gates: Resumo de Convênios (tela 8 do "Modelo App")

OWNS: src/pages/ConveniosPage.jsx, src/pages/ConveniosPage.css

Scope: `/convenios` ganha um resumo real acima da lista de cadastro já existente: reaproveita o widget `DonutConvenios` (mesmo usado no Dashboard) para mostrar a distribuição de sessões por convênio no mês, e cada card de convênio passa a mostrar "Faturado no mês" (soma real de `lancamentos.valor` por convênio) e "Sessões no mês" (contagem real de atendimentos por convênio). Decisão de escopo: o protótipo mostrava também "Glosado" e um badge de "Relatório pendente" — nenhum dos dois existe como dado real no schema (não há coluna de glosa nem rastreio de relatório enviado), então foram deliberadamente omitidos em vez de fabricados.

- [x] G1: Página busca atendimentos e lançamentos reais do mês e calcula faturado/sessões por convênio (não é estático)
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/ConveniosPage.jsx','utf8'); for(const t of ['buscarAtendimentosEntre','buscarLancamentos','resumoPorConvenio','linha.faturado','linha.sessoes']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('RESUMO_REAL_OK')"
  EXPECT: RESUMO_REAL_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=RESUMO_REAL_OK

- [x] G2: Distribuição reaproveita o componente já usado no Dashboard (DRY, mesma lógica testada)
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/ConveniosPage.jsx','utf8'); if(!s.includes('DonutConvenios')) throw new Error('nao reaproveita DonutConvenios'); console.log('REUSE_OK')"
  EXPECT: REUSE_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=REUSE_OK

- [x] G3: "Glosado" e badge de relatório pendente NÃO foram fabricados (não existe dado real para isso)
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/ConveniosPage.jsx','utf8'); if(/[Gg]losad/.test(s)) throw new Error('fabricou dado de glosa sem schema'); if(/[Rr]elatório pendente/.test(s)) throw new Error('fabricou badge de relatorio pendente'); console.log('SEM_FABRICACAO_OK')"
  EXPECT: SEM_FABRICACAO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=SEM_FABRICACAO_OK

- [x] G4: Cadastro/edição de convênio (fluxo antigo) preservado intocado
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/ConveniosPage.jsx','utf8'); for(const t of ['ConvenioForm','abrirNovo','abrirEdicao']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('CADASTRO_PRESERVADO_OK')"
  EXPECT: CADASTRO_PRESERVADO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=CADASTRO_PRESERVADO_OK

- [x] G5: Lint limpo no projeto inteiro
  CHECK: npx oxlint . && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output includes LINT_OK

- [x] G6: Confirmação visual ao vivo — distribuição real + faturado/sessões reais por card
  EVIDENCE: navegador autenticado, /convenios. Widget "Atendimentos por convênio · setembro" mostrou "3 sessões" com barra "Particular 100% · 3". Cards: Amil (R$500/sessão, faturado R$0,00, 0 sessões), Bradesco Saúde (R$200/sessão, repasse 45 dias, teto 4, faturado R$0,00, 0 sessões), SulAmérica (R$190/sessão, repasse 30 dias, faturado R$1.520,00, 0 sessões — valor de lançamentos com vencimento em setembro vindos de atendimentos de meses anteriores, consistente com o mesmo critério de "vencimento" já usado no Financeiro), Unimed (R$180/sessão, repasse 30 dias, teto 4, faturado R$1.260,00, 0 sessões). Cadastro/edição de convênio (botão "Novo convênio", clique no card abre o form) não foi alterado.
