# Gates: Fila de Prontuários (tela 6 do "Modelo App")

OWNS: src/pages/ProntuarioPage.jsx, src/pages/SessaoPage.jsx, src/components/prontuario/WorklistProntuarios.jsx, src/components/prontuario/WorklistProntuarios.css, src/lib/prontuario.js

Scope: /prontuarios (sem `?paciente=`) vira uma fila entre pacientes — "A escrever" (atendimentos realizados sem evolução, com dias em atraso), "Assinados" (já têm evolução, com excerto) e "Documentos" (honestamente ainda não construído, mesmo padrão do EmConstrucaoPage já usado no app, em vez de fingir uma feature que não existe). "Ver por paciente" preserva o fluxo antigo de buscar 1 paciente. Bug real encontrado e corrigido durante o teste ao vivo: o link "Prontuários" da barra lateral não voltava para a fila depois de "Ver por paciente" (estado local sobrevivia à troca de parâmetro); e o cronômetro da sessão mostrava um número absurdo para sessões de dias/semanas atrás.

- [x] G1: Fila é o dado real (realizado sem evolução vs. com evolução), não uma lista estática
  CHECK: node -e "const s=require('fs').readFileSync('src/lib/prontuario.js','utf8'); for(const t of ['.eq(\"status\", \"realizado\")','evolucaoPorAtendimento','aEscrever.push','assinados.push']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('FILA_REAL_OK')"
  EXPECT: FILA_REAL_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=efa4cddda3fd630da302f3f2a934398e135fc0488a0437b1cb512a4d0b886c00; output-bytes=13

- [x] G2: Navegação por URL (não estado local) — o bug do link "Prontuários" não voltar à fila está corrigido
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/ProntuarioPage.jsx','utf8'); if(!s.includes('searchParams.get(\"busca\")')) throw new Error('busca ainda em estado local, nao em URL'); if(s.includes('setBuscaAberta')) throw new Error('ainda usa estado local setBuscaAberta'); console.log('URL_STATE_OK')"
  EXPECT: URL_STATE_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=bce6fef5c25dd41b71e64fb555701e12b7bda6b76ca433e1152a81ec857bece8; output-bytes=13

- [x] G3: Cronômetro da sessão não mostra número absurdo para sessão de dias atrás (janela de 12h)
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/SessaoPage.jsx','utf8'); if(!/dozeHorasMs/.test(s)) throw new Error('limite de 12h ausente'); console.log('CRONOMETRO_LIMITADO_OK')"
  EXPECT: CRONOMETRO_LIMITADO_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=c89a163dcaf3c7e866eac1715d079f7603c1d86a43eff1f9ad636a0287ba03e2; output-bytes=23

- [x] G4: "Documentos" é honesto (mensagem de não construído), não finge uma feature que não existe
  CHECK: node -e "const s=require('fs').readFileSync('src/components/prontuario/WorklistProntuarios.jsx','utf8'); if(!/ainda não foi construída/.test(s)) throw new Error('mensagem honesta ausente'); console.log('HONESTO_OK')"
  EXPECT: HONESTO_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=0ed11b9d5794f0086faf09a17520480c17dc4a1b24a99a6566654ebc1ecaee49; output-bytes=11

- [x] G5: Lint limpo no projeto inteiro
  CHECK: npx oxlint . && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=566348787f7dbaa871b64adda4cdca556afc2f0f6d376a57d55493246b2c0292; output-bytes=9

- [x] G6: Confirmação visual ao vivo — as 3 abas com dado real, "Escrever evolução" abre a sessão certa, "Ver por paciente" e volta pela barra lateral funcionam, cronômetro absurdo não aparece mais
  EVIDENCE: navegador autenticado, /prontuarios. "A escrever" mostrou "26 evoluções pendentes há mais de 48h" + lista real com badges "N DIAS" (50/49/46... dias, decrescente) e "Sessão de DD mmm · Nª". "Assinados" mostrou os registros de seed reais com excerto da evolução. "Documentos" mostrou a mensagem honesta de não construído. Cliquei "Escrever evolução" num item → navegou para /atendimentos/<id>/sessao do paciente e sessão corretos (nome, "1ª sessão", data 16 de jul batendo com o item da fila). Achei e corrigi ao vivo: (1) o link "Prontuários" da barra lateral não voltava à fila depois de "Ver por paciente" — corrigido movendo o estado para a URL (?busca=1) — testado de novo e agora volta corretamente; (2) o cronômetro mostrava "72876:32" para uma sessão de 50 dias atrás — corrigido com janela de 12h, recarreguei a mesma sessão e o cronômetro não aparece mais nesse caso.
