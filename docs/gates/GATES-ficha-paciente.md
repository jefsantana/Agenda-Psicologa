# Gates: Ficha do paciente (tela 5 do "Modelo App") + lista agrupada

OWNS: src/pages/PacientesPage.jsx, src/pages/PacientesPage.css, src/pages/PacienteDetalhePage.jsx, src/pages/PacienteDetalhePage.css, src/components/pacientes/PacienteCard.jsx, src/lib/pacienteDetalhe.js, src/App.jsx

Scope: nova rota /pacientes/:id com a ficha do paciente (protótipo tela 5) — perfil, botão Prontuário/WhatsApp/Editar, 3 chips (sessões/faltas/em aberto), objetivos terapêuticos (reaproveitado), escala GAD-7 (reaproveitada) e sessões recentes com evolução/GAD-7 por sessão. Lista de /pacientes ganhou agrupamento alfabético (tela 4) e datas relativas ("Hoje 15:00"/"Ter 09:00") no lugar de "próxima DD/MM". Todo dado é real — nenhum número inventado; tags "TCC"/"Ansiedade social" do protótipo não foram replicadas por exigirem schema novo (fora de escopo desta rodada).

- [x] G1: Rota /pacientes/:id registrada e protegida por login
  CHECK: node -e "const s=require('fs').readFileSync('src/App.jsx','utf8'); if(!/path=\"\/pacientes\/:id\"/.test(s)) throw new Error('rota ausente'); if(!/PacienteDetalhePage/.test(s)) throw new Error('componente nao importado'); console.log('ROTA_OK')"
  EXPECT: ROTA_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=1a9b360e7bbe88c02add0bba541c78cdb8b919424a9f560a469d5205e10fdb5b; output-bytes=8

- [x] G2: Ficha usa dado real (resumo/GAD-7/objetivos), não hardcoded
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/PacienteDetalhePage.jsx','utf8'); for(const t of ['buscarResumoPaciente','buscarSessoesRecentes','buscarGad7DoPaciente','SecaoObjetivos']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('DADO_REAL_OK')"
  EXPECT: DADO_REAL_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=206191c087cd2ed1111cdaad032909e8f60744afbf902d085882fc964c51d4c7; output-bytes=13

- [x] G3: Lista de Pacientes agrupa por letra inicial
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/PacientesPage.jsx','utf8'); if(!/function agruparPorLetra/.test(s)) throw new Error('agrupamento ausente'); console.log('AGRUPAMENTO_OK')"
  EXPECT: AGRUPAMENTO_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=002c1bc4be88d341ac993f4aca8ae1a4296867f8181d5d11c77e3482eec1ffd4; output-bytes=15

- [x] G4: Card de paciente mostra dia relativo (Hoje/abreviação), não data absoluta DD/MM
  CHECK: node -e "const s=require('fs').readFileSync('src/components/pacientes/PacienteCard.jsx','utf8'); if(!/rotuloProximaSessao/.test(s)) throw new Error('rotulo relativo ausente'); if(/próxima \$\{new Intl/.test(s)) throw new Error('ainda usa formato DD\\/MM antigo'); console.log('DATA_RELATIVA_OK')"
  EXPECT: DATA_RELATIVA_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=27648e30a60afb18357a45afbbc1626bc105e86ff3150dccd54727d4fbb7f2c8; output-bytes=17

- [x] G5: Lint limpo no projeto inteiro
  CHECK: npx oxlint . && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=566348787f7dbaa871b64adda4cdca556afc2f0f6d376a57d55493246b2c0292; output-bytes=9

- [x] G6: Confirmação visual ao vivo — lista agrupada, ficha completa carregando dado real, adicionar objetivo funciona, botão editar (⋯) abre o form com dados reais
  EVIDENCE: navegador autenticado. /pacientes mostra abas Ativos/Em espera/Alta, busca, e a lista agrupada por letra (grupos "J"/"P" visíveis) com datas relativas ("Qui 09:00"). Cliquei em "Jeferson Santana" → abriu /pacientes/:id com perfil, botão Prontuário, ícones WhatsApp/Editar, chips Sessões=2/Faltas=0/Em Aberto=R$0 (batendo com o paciente real), seção Objetivos terapêuticos (sem duplicar título — corrigido durante o teste), Escala GAD-7 vazia, e 2 sessões recentes reais com status corretos. Testei adicionar um objetivo ("Reduzir esquiva social no trabalho") — salvou e apareceu na lista; removi em seguida (dado de teste). Testei o botão "⋯" — abriu o form de edição com nome/telefone/e-mail reais pré-preenchidos; fechei com Cancelar sem salvar.
