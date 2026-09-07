# Gates: Chips condensados (mobile) + ícones de busca/pendências no header

OWNS: src/pages/DashboardPage.jsx, src/pages/DashboardPage.css, src/components/dashboard/DashboardChips.jsx, src/components/dashboard/DashboardChips.css, src/components/layout/AppShell.css

Scope: no protótipo "Modelo App", a tela mobile do Dashboard troca os 4 KPIs por 3 chips condensados (Hoje/Pendências/Mês) e mostra ícones de busca + notificações no header em vez do botão "Novo atendimento" (que já existe como "+" flutuante na TabBar). Implementado com dado real (nenhum número inventado): busca → /pacientes, notificações → /agenda com indicador quando há pendências reais (mesmas usadas no banner já existente).

- [x] G1: DashboardChips existe e usa os campos reais de `kpis` (não hardcoded)
  CHECK: node -e "const s=require('fs').readFileSync('src/components/dashboard/DashboardChips.jsx','utf8'); for(const t of ['kpis.hoje.concluidos','kpis.faltas.remarcacoesAConfirmar','kpis.financeiro.recebidoMes']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('CHIPS_REAIS_OK')"
  EXPECT: CHIPS_REAIS_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=68865396f548e9e0ad0f9db91a70e46cf72cd1c50f91d0c09544edc49770ac97; output-bytes=15

- [x] G2: KPIs completos e chips condensados nunca aparecem juntos (um esconde o outro por breakpoint)
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/DashboardPage.css','utf8'); if(!/\.dashboard__kpis\s*\{\s*display:\s*none/.test(s)) throw new Error('kpis nao escondido por padrao'); if(!/\.dashboard__chips\s*\{\s*display:\s*none/.test(s)) throw new Error('chips nao escondido no desktop'); console.log('BREAKPOINT_OK')"
  EXPECT: BREAKPOINT_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=77fcaa69934db583179f5a0f4ea4a158f6b076c87c220a49bee0c5f2d213fc33; output-bytes=14

- [x] G3: Ícone de notificações usa sinal real de pendência (mesma variável do banner já existente), não um valor fixo
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/DashboardPage.jsx','utf8'); if(!/temAvisosPendentes/.test(s)) throw new Error('sinal real ausente'); console.log('SINAL_REAL_OK')"
  EXPECT: SINAL_REAL_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=5eb544d0ca937d6ee98c3ff5ac23cf8e455285c3b1ec98956956c85e502242d3; output-bytes=14

- [x] G4: Botão "Novo atendimento" (texto) escondido abaixo de 1024px — não duplica o "+" da TabBar
  CHECK: node -e "const s=require('fs').readFileSync('src/components/layout/AppShell.css','utf8'); if(!/max-width:\s*1023px[\s\S]{0,80}\.shell__acao-primaria[\s\S]{0,40}display:\s*none/.test(s)) throw new Error('nao esconde no mobile'); console.log('SEM_DUPLICATA_OK')"
  EXPECT: SEM_DUPLICATA_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=b8d174db56aadec0b56d0146931b8b22cba93c1f1d480604fc46922d22e3a13f; output-bytes=17

- [x] G5: Lint limpo
  CHECK: npx oxlint src/pages/DashboardPage.jsx src/components/dashboard/DashboardChips.jsx && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=566348787f7dbaa871b64adda4cdca556afc2f0f6d376a57d55493246b2c0292; output-bytes=9

- [x] G6: Confirmação visual ao vivo — desktop mostra os 4 KPIs + ícones + botão; mobile (simulado) mostra os 3 chips + só os ícones, com números batendo (Pendências = tarefas atrasadas + remarcações)
  EVIDENCE: navegador autenticado, /hoje. Desktop (largura real ~1420px): 4 KPIs completos + ícones de busca/sino + botão "Novo atendimento" lado a lado no header — todos visíveis juntos, como esperado nesta largura. Simulei mobile injetando CSS temporário (!important) que esconde .sidebar/.dashboard__kpis/.shell__acao-primaria e força .dashboard__chips a aparecer (resize real da janela não funciona neste ambiente — Chrome ignora comandos de resize). Resultado: 3 chips "Hoje 0/2", "Pendências 3 · 3 tarefas · 0 remarcar", "Setembro R$0 ↓100%" — Pendências bate (3 tarefas atrasadas + 0 remarcações = 3, valores reais confirmados contra a mesma tela cheia). Ícone de sino mostrou o ponto de aviso (pendentesConfirmacao=2>0). CSS de simulação removido em seguida; nada persistido.
