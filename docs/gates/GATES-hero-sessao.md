# Gates: Card "Próxima sessão" no Dashboard (Hoje)

OWNS: src/pages/DashboardPage.jsx, src/components/dashboard/ProximaSessaoCard.jsx, src/components/dashboard/ProximaSessaoCard.css

Scope: o protótipo "Modelo App" (tela 1, "Olá, Raquel") destaca a próxima sessão num card de hero com hora grande, nome do paciente e botões "Iniciar"/calendário/WhatsApp — hoje isso só aparece como mais um KPI igual aos outros 3, sem ação nenhuma. Adiciona esse card reaproveitando dados/fluxos já existentes (Iniciar → tela de sessão já construída; calendário → /agenda; WhatsApp → sheet já existente), sem duplicar o KPI "Próximo atendimento" (que continua existindo).

- [x] G1: calcularKpis expõe o id do atendimento em `proximo` (necessário para o link "Iniciar")
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/DashboardPage.jsx','utf8'); if(!/proximo\s*=\s*proximoAtendimento[\s\S]{0,120}id:\s*proximoAtendimento\.id/.test(s)) throw new Error('id ausente em proximo'); console.log('PROXIMO_ID_OK')"
  EXPECT: PROXIMO_ID_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=f5efa0ac0b76a8e0194f2ed1012c6fd3b1145474aaa255b2e37d2274911b8b27; output-bytes=14

- [x] G2: Componente novo existe e linka "Iniciar" para a rota real de sessão (não é um botão decorativo)
  CHECK: node -e "const s=require('fs').readFileSync('src/components/dashboard/ProximaSessaoCard.jsx','utf8'); if(!/\/atendimentos\/\$\{.*\}\/sessao/.test(s)) throw new Error('link de sessao ausente'); console.log('LINK_SESSAO_OK')"
  EXPECT: LINK_SESSAO_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=cb3950e96629e550325820cfafd84bd362ab85544f327bd988553cf50979ef8b; output-bytes=15

- [x] G3: Card renderizado no Dashboard só quando existe próximo atendimento (sem quebrar quando é null)
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/DashboardPage.jsx','utf8'); if(!/kpis\.proximo\s*&&/.test(s) && !/kpis\?\.proximo\s*&&/.test(s)) throw new Error('render condicional ausente'); console.log('RENDER_CONDICIONAL_OK')"
  EXPECT: RENDER_CONDICIONAL_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=ecb60a6f7f8c9833241cd949f36826aa8e43a605c7553c967fe68b80ae227f8f; output-bytes=22

- [x] G4: Lint limpo
  CHECK: npx oxlint src/pages/DashboardPage.jsx src/components/dashboard/ProximaSessaoCard.jsx && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=566348787f7dbaa871b64adda4cdca556afc2f0f6d376a57d55493246b2c0292; output-bytes=9

- [x] G5: Confirmação visual ao vivo (navegador autenticado) — card aparece e o botão "Iniciar" navega para a sessão real
  EVIDENCE: sem atendimento futuro hoje o card corretamente não aparecia (kpis.proximo=null); inseri um atendimento de teste 55min no futuro via SQL, recarreguei /hoje, e o card "PRÓXIMA SESSÃO · EM 55 min" apareceu com hora/nome/modalidade corretos. Cliquei em "Iniciar" e a URL mudou para /atendimentos/bc40dd14.../sessao, carregando a tela de sessão certa (paciente, 4ª sessão). Dado de teste removido depois; banco conferido de volta ao estado exato de antes (116 atendimentos, 16 evolucoes, 0 gad7).
