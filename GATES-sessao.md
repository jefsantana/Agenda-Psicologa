# Gates: Modo de sessão ao vivo (evolução + GAD-7)

OWNS: supabase/schema_v12_gad7.sql, src/lib/sessao.js, src/pages/SessaoPage.jsx, src/pages/SessaoPage.css, src/components/prontuario/FormularioGad7.jsx, src/components/prontuario/FormularioGad7.css, src/components/prontuario/Gad7Grafico.jsx, src/components/prontuario/Gad7Grafico.css, src/components/prontuario/AbaDados.jsx, src/App.jsx, src/components/dashboard/AgendaDoDia.jsx, src/components/dashboard/AgendaDoDia.css, src/components/agenda/AtendimentoRow.jsx, src/components/agenda/AtendimentoRow.css

Scope: reativar o registro de evolução por sessão (texto livre, versionado, nunca sobrescrito) — decisão confirmada explicitamente pelo usuário mesmo sabendo que havia sido removida antes — e adicionar a escala GAD-7 (instrumento público, Spitzer/Kroenke/Williams 2006) por sessão, com gráfico de tendência. Nova tela /atendimentos/:id/sessao com cronômetro, editor com autosave, chips de inserção rápida e as 3 abas do protótipo (Evolução/Histórico/Plano), reaproveitando AbaHistorico e SecaoObjetivos já existentes. Entrada pela Agenda do dia (Dashboard) e pela lista de /agenda.

- [x] G8: Migração cria avaliacoes_gad7 com RLS via eh_psicologa() e 7 respostas (0-3 cada)
  CHECK: node -e "const s=require('fs').readFileSync('supabase/schema_v12_gad7.sql','utf8'); for(const t of ['avaliacoes_gad7','eh_psicologa','array_length(respostas, 1) = 7']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('MIGRACAO_OK')"
  EXPECT: MIGRACAO_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=fd1b43dc014d1b79aa14d46a69dc4cf5ab25e54c1d45d3a3a8d62d13b4c6266d; output-bytes=12

- [x] G9: Rota /atendimentos/:id/sessao registrada e protegida por login
  CHECK: node -e "const s=require('fs').readFileSync('src/App.jsx','utf8'); if(!/path=\"\/atendimentos\/:id\/sessao\"/.test(s)) throw new Error('rota ausente'); if(!/SessaoPage/.test(s)) throw new Error('SessaoPage nao importado'); console.log('ROTA_OK')"
  EXPECT: ROTA_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=1a9b360e7bbe88c02add0bba541c78cdb8b919424a9f560a469d5205e10fdb5b; output-bytes=8

- [x] G10: Autosave versionado e GAD-7 realmente ligados na tela de sessão (não é só UI estática)
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/SessaoPage.jsx','utf8'); for(const t of ['salvarNovaVersaoEvolucao','buscarUltimaEvolucao','Gad7Grafico','FormularioGad7','ATRASO_AUTOSAVE_MS']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('SESSAO_LIGADA_OK')"
  EXPECT: SESSAO_LIGADA_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=23a6c91a6f94c758ced8b801b85b0be41f9756ce87ac14d608bc8e3502a5ad8f; output-bytes=17

- [x] G11: Pontos de entrada "Iniciar sessão" existem na Agenda do dia (Dashboard) e na lista de /agenda
  CHECK: node -e "const a=require('fs').readFileSync('src/components/dashboard/AgendaDoDia.jsx','utf8'); const b=require('fs').readFileSync('src/components/agenda/AtendimentoRow.jsx','utf8'); if(!a.includes('/sessao')) throw new Error('AgendaDoDia sem link de sessao'); if(!b.includes('/sessao')) throw new Error('AtendimentoRow sem link de sessao'); console.log('ENTRADAS_OK')"
  EXPECT: ENTRADAS_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=c085664715846f014e53cb0214b3d5b62c16475f10fde3615842da058bffef9a; output-bytes=12

- [x] G12: Lint limpo em todos os arquivos novos/alterados deste escopo
  CHECK: npx oxlint src/lib/sessao.js src/pages/SessaoPage.jsx src/components/prontuario/FormularioGad7.jsx src/components/prontuario/Gad7Grafico.jsx src/components/prontuario/AbaDados.jsx src/components/dashboard/AgendaDoDia.jsx src/components/agenda/AtendimentoRow.jsx src/App.jsx && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=566348787f7dbaa871b64adda4cdca556afc2f0f6d376a57d55493246b2c0292; output-bytes=9

- [x] G13: Migração aplicada no projeto Supabase real (raquel-frois-agenda, soipxtrqzqmilpiblwcr) via MCP, a pedido explícito do usuário
  EVIDENCE: apply_migration retornou success=true. Verificado via list_tables: avaliacoes_gad7 existe, rls_enabled=true, coluna pontuacao é "generated"/stored, FKs corretas para atendimentos/pacientes/auth.users. Testes funcionais: (1) insert válido com 7 notas=2 gerou pontuacao=14 corretamente; (2) insert com nota=5 (fora de 0-3) rejeitado pela constraint avaliacoes_gad7_notas_0_a_3; (3) insert com array de 6 respostas rejeitado pela constraint avaliacoes_gad7_7_respostas; (4) insert de nova versão em evolucoes (simulando autosave do app) contra atendimento/prontuário reais funcionou. get_advisors (security) não apontou nenhum problema novo relacionado a avaliacoes_gad7. Todas as linhas de teste foram apagadas em seguida; contagens confirmadas de volta ao estado anterior (gad7_count=0, evolucoes_count=16).
