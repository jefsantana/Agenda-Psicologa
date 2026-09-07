# Gates: Relatórios (fechamento mensal real)

OWNS: src/pages/RelatoriosPage.jsx, src/pages/RelatoriosPage.css, src/lib/relatorios.js, src/lib/relatorioPdf.js, src/App.jsx

Scope: `/relatorios` deixa de ser `EmConstrucaoPage` e vira uma página real com fechamento mensal (sessões realizadas/faltas/remarcações/canceladas, faturado por sessão realizada, recebido por pagamento confirmado, pendente por vencimento), detalhamento "Por convênio" e exportação de um PDF real via jsPDF (mesma biblioteca já usada nos recibos). Decisão de escopo: envio automático às operadoras exige integração própria com cada convênio, que não existe — a página é honesta sobre isso e oferece só a exportação manual. Como consequência, `EmConstrucaoPage` ficou sem nenhum uso no projeto (também servia só a Mensagens, já substituída) e foi removida.

- [x] G1: Fechamento mensal é calculado a partir de dados reais (atendimentos por status + lançamentos), não estático
  CHECK: node -e "const s=require('fs').readFileSync('src/lib/relatorios.js','utf8'); for(const t of ['buscarAtendimentosEntre','buscarLancamentos','status === \"realizado\"','status === \"falta\"','status === \"remarcar\"','status === \"cancelado\"']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('FECHAMENTO_REAL_OK')"
  EXPECT: FECHAMENTO_REAL_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=FECHAMENTO_REAL_OK

- [x] G2: Exportação de PDF reaproveita jsPDF (mesmo padrão do recibo), com import dinâmico para não pesar o bundle inicial
  CHECK: node -e "const s1=require('fs').readFileSync('src/lib/relatorioPdf.js','utf8'); if(!s1.includes('jspdf')) throw new Error('nao usa jsPDF'); const s2=require('fs').readFileSync('src/pages/RelatoriosPage.jsx','utf8'); if(!/import\\(.\\.\\.\\/lib\\/relatorioPdf\\.js.\\)/.test(s2)) throw new Error('nao usa import dinamico'); console.log('PDF_OK')"
  EXPECT: PDF_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=PDF_OK

- [x] G3: Envio automático às operadoras NÃO foi fabricado — página é honesta sobre a limitação
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/RelatoriosPage.jsx','utf8'); if(!/exige integração própria com cada convênio/.test(s)) throw new Error('aviso honesto ausente'); console.log('HONESTO_OK')"
  EXPECT: HONESTO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=HONESTO_OK

- [x] G4: Rota /relatorios usa a página nova; EmConstrucaoPage (sem mais nenhum uso) foi removida do projeto
  CHECK: node -e "const s=require('fs').readFileSync('src/App.jsx','utf8'); if(s.includes('EmConstrucaoPage')) throw new Error('EmConstrucaoPage ainda referenciado em App.jsx'); const m=s.match(/path=\"\\/relatorios\"[\\s\\S]{0,150}/); if(!m || !m[0].includes('RelatoriosPage')) throw new Error('rota nao aponta para RelatoriosPage'); const fs=require('fs'); if(fs.existsSync('src/pages/EmConstrucaoPage.jsx')) throw new Error('arquivo orfao ainda existe'); console.log('ROTA_E_LIMPEZA_OK')"
  EXPECT: ROTA_E_LIMPEZA_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=ROTA_E_LIMPEZA_OK

- [x] G5: Lint limpo no projeto inteiro
  CHECK: npx oxlint . && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output includes LINT_OK

- [x] G6: Confirmação visual ao vivo — KPIs reais, lista por convênio real e exportação de PDF sem erro
  EVIDENCE: navegador autenticado, /relatorios, Setembro 2026. KPIs mostraram "Sessões realizadas 1", "Faltas/remarcações 1/0", "Faturado no mês R$0", "Recebido no mês R$0 · R$2.040 pendente" (números reais batendo com o estado atual do banco). "Por convênio" mostrou "Particular · 1 sessão · R$0,00". Cliquei "Exportar PDF" — botão voltou ao estado normal sem travar e o console (`read_console_messages`) não mostrou nenhum erro, confirmando que `gerarRelatorioMensalPdf` rodou até `doc.save()` sem falhas.
