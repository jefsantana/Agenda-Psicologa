# Gates: Central de Mensagens (tela 9 do "Modelo App")

OWNS: src/pages/MensagensPage.jsx, src/pages/MensagensPage.css, src/App.jsx

Scope: `/mensagens` deixa de ser `EmConstrucaoPage` e vira uma página real que reaproveita o fluxo já existente e testado de WhatsApp (`WhatsappRapido` → `WhatsappSheet` → `linkWhatsapp`, mesmo usado no Dashboard e no "Cobrar" do Financeiro): botão "Nova mensagem" abre a busca real de paciente/dia e o compositor com modelos reais. Decisão de escopo: o protótipo mostrava "Lembretes automáticos" (toggle) e "Conversas" (histórico de chat de duas vias) — nenhum dos dois é implementável sem uma integração real com a API do WhatsApp Business, que não existe no projeto. Em vez de fingir essas features, a página explica honestamente por que ainda não existem, no mesmo espírito do `EmConstrucaoPage` já usado em Relatórios/Documentos.

- [x] G1: "Nova mensagem" reaproveita o fluxo real já testado (WhatsappRapido/WhatsappSheet/linkWhatsapp), não é um formulário novo e paralelo
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/MensagensPage.jsx','utf8'); for(const t of ['WhatsappRapido','setWhatsappAberto']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('REUSE_FLUXO_OK')"
  EXPECT: REUSE_FLUXO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=REUSE_FLUXO_OK

- [x] G2: "Lembretes automáticos" (toggle) e "Conversas" (chat de duas vias) NÃO foram fabricados
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/MensagensPage.jsx','utf8'); if(/type=\"checkbox\"/.test(s)) throw new Error('fabricou toggle de lembretes automaticos'); if(/CONVERSAS|conversas-lista|thread/i.test(s)) throw new Error('fabricou lista de conversas falsa'); console.log('SEM_FABRICACAO_OK')"
  EXPECT: SEM_FABRICACAO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=SEM_FABRICACAO_OK

- [x] G3: Página explica honestamente por que lembretes automáticos e conversas não existem (mesmo espírito do EmConstrucaoPage)
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/MensagensPage.jsx','utf8'); if(!/API oficial do WhatsApp Business/.test(s)) throw new Error('explicacao honesta ausente'); console.log('HONESTO_OK')"
  EXPECT: HONESTO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=HONESTO_OK

- [x] G4: Rota /mensagens usa a página nova, não mais o EmConstrucaoPage
  CHECK: node -e "const s=require('fs').readFileSync('src/App.jsx','utf8'); const m=s.match(/path=\"\\/mensagens\"[\\s\\S]{0,200}/); if(!m || !m[0].includes('MensagensPage')) throw new Error('rota ainda aponta para EmConstrucaoPage'); console.log('ROTA_OK')"
  EXPECT: ROTA_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=ROTA_OK

- [x] G5: Lint limpo no projeto inteiro
  CHECK: npx oxlint . && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output includes LINT_OK

- [x] G6: Confirmação visual ao vivo — botão "Nova mensagem" abre o picker real de paciente/dia com dados reais
  EVIDENCE: navegador autenticado, /mensagens. Página mostrou "Modelos rápidos" (Lembrete de consulta / Confirmar consulta / Cobrança / Mensagem livre), aviso "Nunca envie conteúdo clínico por mensagem" e a seção honesta sobre lembretes automáticos/conversas exigirem API do WhatsApp Business. Cliquei "Nova mensagem" → abriu o sheet real "Enviar WhatsApp" com a semana e um atendimento real do dia (Jeferson Santana, 20:00, telefone real) — mesmo fluxo já usado no Dashboard. Fechei o sheet sem enviar nada.
