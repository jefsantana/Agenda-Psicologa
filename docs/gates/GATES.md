# Gates: Reskin mobile (TabBar + Agenda) para o Modelo App

OWNS: src/components/layout/TabBar.jsx, src/components/layout/TabBar.css, src/components/layout/MaisMenu.jsx, src/components/layout/AppShell.jsx, src/components/agenda/AtendimentoRow.jsx, src/components/agenda/AtendimentoRow.css

Scope: aplicar o visual do protótipo "Modelo App" (Agenda App (offline).html) às telas móveis já existentes — TabBar com botão "+" flutuante (abre Novo Atendimento globalmente via AppShell) e linhas de atendimento da página /agenda coloridas por status (como no Dashboard), em vez de por modalidade. SeletorDataAgenda/CalendarioMes já herdam a paleta nova via tokens — sem mudança estrutural (virar tira semanal seria UX nova, fora do escopo "só reskin"). Sem funcionalidade clínica nova (GAD-7, sessão ao vivo, mensagens automáticas ficam fora deste escopo, por decisão do usuário).

- [x] G1: TabBar mobile tem um botão de ação central elevado (estilo protótipo), distinto dos outros 4 itens de navegação
  CHECK: node -e "const c=require('fs').readFileSync('src/components/layout/TabBar.css','utf8'); if(!/tabbar__acao/.test(c)) throw new Error('classe tabbar__acao ausente'); console.log('TABBAR_ACAO_OK')"
  EXPECT: TABBAR_ACAO_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=d296f9f7bca08347aa5d7d7865f906b6b38b7d32fe0cb3a7012197e71dff0cd7; output-bytes=15

- [x] G2: Linha de atendimento de /agenda (AtendimentoRow) colore a borda esquerda pelo STATUS do atendimento (não mais pela modalidade), igual ao padrão já aplicado em AgendaDoDia
  CHECK: node -e "const jsx=require('fs').readFileSync('src/components/agenda/AtendimentoRow.jsx','utf8'); if(!/function corDoStatus/.test(jsx)) throw new Error('corDoStatus ausente'); if(/tipo === .online. \? .var\(--info\)/.test(jsx)) throw new Error('ainda colore por tipo/modalidade'); console.log('COR_POR_STATUS_OK')"
  EXPECT: COR_POR_STATUS_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=71e00413896b5539a4e86441b04a982f41ab60b4eb0a2542f70c19179388c406; output-bytes=18

- [x] G3: Nenhum erro de compilação (lint limpo) nos arquivos alterados deste escopo
  CHECK: npx oxlint src/components/layout/TabBar.jsx src/components/layout/MaisMenu.jsx src/components/layout/AppShell.jsx src/components/agenda/AtendimentoRow.jsx && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=566348787f7dbaa871b64adda4cdca556afc2f0f6d376a57d55493246b2c0292; output-bytes=9

- [x] G4: Confirmação visual manual — print da tela de login (não requer autenticação) carrega sem erro após as mudanças de CSS compartilhado, como sinal de que nada global quebrou
  EVIDENCE: screenshot em scratchpad/login-g4.png, 874339 bytes — idêntico byte-a-byte ao print de baseline anterior a esta sessão; nenhuma regressão visual global. TabBar/AppShell em si não puderam ser fotografados (exigem sessão autenticada real, que não tentei sem autorização).
