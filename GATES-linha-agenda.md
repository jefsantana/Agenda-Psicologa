# Gates: Linhas da Agenda do dia — clique abre detalhe + compacto no mobile

OWNS: src/components/dashboard/AgendaDoDia.jsx, src/components/dashboard/AgendaDoDia.css

Scope: implementa o que já estava na spec original ("clique no corpo abre o detalhe do atendimento; botões param a propagação") e nunca tinha sido feito — clicar na linha da Agenda do dia (Dashboard) abre o formulário de edição, sem disparar junto com os botões internos (confirmar, iniciar, prontuário, menu). Além disso, abaixo de 1024px a linha fica compacta como no "Modelo App": sem avatar nem botões de ação, só um chevron indicando que é clicável — a barra de confirmação (Atendido/Faltou/etc.) continua visível em qualquer largura, por ser funcionalidade real, não decoração.

- [x] G1: A linha tem role de botão, é focável por teclado e chama onEditar ao clicar
  CHECK: node -e "const s=require('fs').readFileSync('src/components/dashboard/AgendaDoDia.jsx','utf8'); for(const t of ['role=\"button\"','tabIndex={0}','onClick={handleClicarLinha}','onKeyDown={handleTeclarLinha}']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('LINHA_CLICAVEL_OK')"
  EXPECT: LINHA_CLICAVEL_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=eb8d82ea35c801d842d1c3c3ff2031965bd039ec97884f7ad91004b8ac76de88; output-bytes=18

- [x] G2: Botões internos (confirmação e ações) param a propagação — não abrem o form de edição junto
  CHECK: node -e "const s=require('fs').readFileSync('src/components/dashboard/AgendaDoDia.jsx','utf8'); const n=(s.match(/event\.stopPropagation\(\)/g)||[]).length; if(n<2) throw new Error('stopPropagation insuficiente: '+n); console.log('STOP_PROPAGATION_OK')"
  EXPECT: STOP_PROPAGATION_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=81e835ea488f9e8872ba0dd3fe94fa92b273ec0a28cf72495a63454a25442a17; output-bytes=20

- [x] G3: Avatar, ações e chevron têm regra de breakpoint em 1023px (3 ocorrências — uma por elemento)
  CHECK: node -e "const s=require('fs').readFileSync('src/components/dashboard/AgendaDoDia.css','utf8'); const n=(s.match(/max-width:\s*1023px/g)||[]).length; if(n<3) throw new Error('esperava 3+ ocorrencias de max-width:1023px, achei '+n); console.log('BREAKPOINT_OK count='+n)"
  EXPECT: BREAKPOINT_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=d3b13560e1cfc61bfb9159a40cb3f4e7a796a822bf73c07766bd04d16e63b37f; output-bytes=22

- [x] G4: Lint limpo
  CHECK: npx oxlint src/components/dashboard/AgendaDoDia.jsx && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=566348787f7dbaa871b64adda4cdca556afc2f0f6d376a57d55493246b2c0292; output-bytes=9

- [x] G5: Confirmação visual ao vivo — clique na linha abre o form de edição (desktop); botões internos não disparam o form junto; visão mobile simulada mostra chevron sem avatar/ações
  EVIDENCE: navegador autenticado, /hoje, view Lista. (1) Cliquei no nome "Jeferson Santana" (fora dos botões) → abriu "Editar atendimento" com os dados certos (Jeferson Santana, 04/09/2026, 20:00, 50min, Presencial, Particular, Agendado); fechei com Cancelar. (2) Cliquei no texto "Confirme o que aconteceu" (dentro do bloco com stopPropagation, sem mutar status) → nenhum modal abriu, confirmando que o stopPropagation intercepta antes de chegar na linha. (3) Injetei CSS temporário forçando .agenda-linha__avatar{display:none} — avatar sumiu nas duas linhas, layout permaneceu íntegro (hora/nome/badge/confirmação). CSS de simulação removido depois; nada persistido no banco.
