# Gates: Migração dos ícones para lucide-react

OWNS: package.json, src/components/dashboard/icons.jsx, src/components/layout/icons.jsx, src/pages/DashboardPage.jsx, src/components/layout/TabBar.jsx, src/components/dashboard/TarefasPainel.jsx

Scope: o projeto não tinha nenhuma biblioteca de ícones — todo ícone era um SVG desenhado à mão imitando o estilo Lucide (conforme já recomendado pelo handoff de design). Instalado `lucide-react` e migrados todos os ícones genéricos de UI (menu lateral, KPIs, botões "+", busca, sino, etc.) para os componentes oficiais da biblioteca, mantendo os mesmos nomes de exportação (`IconeDashboard`, `IconeMais` etc.) para não quebrar nenhum call site. O ícone do WhatsApp foi mantido como SVG próprio — é um logo de marca, fora do escopo de um pacote de ícones genéricos como o Lucide.

- [x] G1: lucide-react está instalado como dependência real do projeto
  CHECK: node -e "const p=require('./package.json'); if(!p.dependencies['lucide-react']) throw new Error('lucide-react ausente em package.json'); console.log('DEPENDENCIA_OK')"
  EXPECT: DEPENDENCIA_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=DEPENDENCIA_OK

- [x] G2: Os dois arquivos centrais de ícones (dashboard/icons.jsx e layout/icons.jsx) importam de lucide-react, não são mais só SVG à mão
  CHECK: node -e "const a=require('fs').readFileSync('src/components/dashboard/icons.jsx','utf8'); const b=require('fs').readFileSync('src/components/layout/icons.jsx','utf8'); if(!a.includes('from \"lucide-react\"')) throw new Error('dashboard/icons.jsx nao usa lucide-react'); if(!b.includes('from \"lucide-react\"')) throw new Error('layout/icons.jsx nao usa lucide-react'); console.log('MIGRACAO_ICONS_OK')"
  EXPECT: MIGRACAO_ICONS_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=MIGRACAO_ICONS_OK

- [x] G3: Todas as funções Icone* exportadas continuam existindo com os mesmos nomes (nenhum call site quebrado)
  CHECK: node -e "const a=require('fs').readFileSync('src/components/dashboard/icons.jsx','utf8'); const b=require('fs').readFileSync('src/components/layout/icons.jsx','utf8'); const nomes=['IconeChecklist','IconeRelogio','IconeAlerta','IconeCifrao','IconeMais','IconePacienteMais','IconeProntuarioMais','IconeEnviar','IconeSeta','IconeSetaCima','IconeCalendario','IconeMaisOpcoes','IconeWhatsapp']; for(const n of nomes) if(!a.includes('export function '+n)) throw new Error('faltando em dashboard/icons.jsx: '+n); const nomesB=['IconeDashboard','IconeAgenda','IconeAtendimentos','IconeProntuarios','IconePacientes','IconeConvenios','IconeFinanceiro','IconeRelatorios','IconeMensagens','IconeConfiguracoes','IconeSino','IconeBusca','IconeMais','IconeSair']; for(const n of nomesB) if(!b.includes('export function '+n)) throw new Error('faltando em layout/icons.jsx: '+n); console.log('EXPORTS_PRESERVADOS_OK')"
  EXPECT: EXPORTS_PRESERVADOS_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=EXPORTS_PRESERVADOS_OK

- [x] G4: Ícone de marca (WhatsApp) foi mantido como SVG próprio, não fabricado como se existisse no Lucide
  CHECK: node -e "const s=require('fs').readFileSync('src/components/dashboard/icons.jsx','utf8'); const m=s.match(/export function IconeWhatsapp[\\s\\S]{0,200}/); if(!m || !m[0].includes('<svg')) throw new Error('IconeWhatsapp nao e mais um svg proprio'); console.log('WHATSAPP_PROPRIO_OK')"
  EXPECT: WHATSAPP_PROPRIO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=WHATSAPP_PROPRIO_OK

- [x] G5: SVGs soltos fora dos dois arquivos centrais (Dashboard header, TabBar, Tarefas) também migrados para lucide-react
  CHECK: node -e "const files=['src/pages/DashboardPage.jsx','src/components/layout/TabBar.jsx','src/components/dashboard/TarefasPainel.jsx']; for(const f of files){ const s=require('fs').readFileSync(f,'utf8'); if(/viewBox=\"0 0 24 24\"/.test(s)) throw new Error('ainda tem svg solto em '+f); if(!s.includes('from \"lucide-react\"')) throw new Error('nao importa lucide-react em '+f);} console.log('SVGS_SOLTOS_MIGRADOS_OK')"
  EXPECT: SVGS_SOLTOS_MIGRADOS_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=SVGS_SOLTOS_MIGRADOS_OK

- [x] G6: Lint limpo no projeto inteiro
  CHECK: npx oxlint . && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output includes LINT_OK

- [x] G7: Confirmação visual ao vivo — ícones renderizam corretamente em várias telas, sem espaço em branco ou ícone quebrado
  EVIDENCE: navegador autenticado, após reload. /hoje: ícones da sidebar (grade, calendário, prancheta, arquivo, pessoas, cartão, cifrão-circular, gráfico de barras, envelope, engrenagem), ícones do cabeçalho (lupa, sino com dot de notificação, "+ Novo atendimento"), KPIs (checklist, relógio, triângulo de alerta, cifrão) e "Nova tarefa" todos renderizaram nítidos e no tamanho esperado. /convenios: "+ Novo convênio" e ícone de cartão na sidebar OK. /pacientes: botões "WhatsApp" (ícone de marca próprio, verde) e "Prontuário" nos cards renderizaram normalmente.
