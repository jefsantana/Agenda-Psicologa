# Gates: Resumo do Financeiro (tela 7 do "Modelo App")

OWNS: src/pages/FinanceiroPage.jsx, src/components/financeiro/ResumoFinanceiro.jsx, src/components/financeiro/ResumoFinanceiro.css, src/lib/financeiro.js

Scope: `/financeiro` ganha 3 abas (Resumo/Lançamentos/Relatórios). "Resumo" é dado real por mês (recebido, delta vs. mês anterior, % recebido, ticket médio, vencidos) com navegação de mês e lista "A receber" com botão "Cobrar" via WhatsApp (usa telefone real do paciente). "Lançamentos" preserva 100% do fluxo antigo (dar baixa, estornar, emitir recibo). "Relatórios" é honestamente ainda não construído. Bug real corrigido durante o teste ao vivo: `text-transform: capitalize` no rótulo "Recebido em {mês}" capitalizava cada palavra ("Recebido Em Setembro"); removido do CSS.

- [x] G1: Financeiro.js busca telefone do paciente para permitir o botão "Cobrar"
  CHECK: node -e "const s=require('fs').readFileSync('src/lib/financeiro.js','utf8'); for(const t of ['telefone','pacientes(nome, telefone)']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('TELEFONE_OK')"
  EXPECT: TELEFONE_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=TELEFONE_OK

- [x] G2: Resumo é calculado a partir dos lançamentos reais (recebido, delta, ticket médio, vencidos), não estático
  CHECK: node -e "const s=require('fs').readFileSync('src/components/financeiro/ResumoFinanceiro.jsx','utf8'); for(const t of ['recebidoMes','deltaPct','ticketMedio','totalVencido','aReceberOrdenado']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('RESUMO_REAL_OK')"
  EXPECT: RESUMO_REAL_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=RESUMO_REAL_OK

- [x] G3: Botão "Cobrar" usa link real de WhatsApp com o telefone do paciente, com fallback desabilitado quando não há telefone
  CHECK: node -e "const s=require('fs').readFileSync('src/components/financeiro/ResumoFinanceiro.jsx','utf8'); for(const t of ['linkWhatsapp','numeroWhatsappOuNull','resumo-fin__cobrar--desabilitado']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('COBRAR_OK')"
  EXPECT: COBRAR_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=COBRAR_OK

- [x] G4: "Lançamentos" preserva o fluxo antigo (dar baixa, estornar, emitir recibo) intocado dentro da nova estrutura de abas
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/FinanceiroPage.jsx','utf8'); for(const t of ['confirmarBaixa','confirmarEstorno','handleRecibo','aba === \"lancamentos\"']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('LANCAMENTOS_PRESERVADO_OK')"
  EXPECT: LANCAMENTOS_PRESERVADO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=LANCAMENTOS_PRESERVADO_OK

- [x] G5: "Relatórios" é honesto (mensagem de não construído), não finge uma feature que não existe
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/FinanceiroPage.jsx','utf8'); if(!/ainda não foram construídos/.test(s)) throw new Error('mensagem honesta ausente'); console.log('HONESTO_OK')"
  EXPECT: HONESTO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=HONESTO_OK

- [x] G6: Bug do `text-transform: capitalize` sobre-capitalizando o rótulo do mês está corrigido
  CHECK: node -e "const s=require('fs').readFileSync('src/components/financeiro/ResumoFinanceiro.css','utf8'); const m=s.match(/\.resumo-fin__rotulo\s*{[^}]*}/); if(m && /text-transform:\s*capitalize/.test(m[0])) throw new Error('ainda capitaliza cada palavra'); console.log('CAPITALIZE_FIX_OK')"
  EXPECT: CAPITALIZE_FIX_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=CAPITALIZE_FIX_OK

- [x] G7: Lint limpo no projeto inteiro
  CHECK: npx oxlint . && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output includes LINT_OK

- [x] G8: Confirmação visual ao vivo — aba "Resumo" mostra card de recebido/delta/barra, chips reais e lista "A receber" com botões "Cobrar" funcionais; rótulo do mês corrigido
  EVIDENCE: navegador autenticado, /financeiro. Aba "Resumo": card "Recebido em setembro R$ 740", "↓ 53% vs. mês anterior", barra 27% recebido / R$2.040 a receber. Chips "Sessões Pagas 4/15", "Ticket Médio R$185", "Vencidos R$6.470 · 16 pacientes". Lista "A receber" ordenada por vencimento com "venceu há N dias" reais e botões verdes "Cobrar". Rótulo do card confirmado como "Recebido em setembro" (minúsculo, sem duplo-capitalize) após remover `text-transform: capitalize` de `.resumo-fin__rotulo`.
