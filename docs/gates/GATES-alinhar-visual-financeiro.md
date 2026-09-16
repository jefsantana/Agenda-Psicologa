# Gates: Alinhar identidade visual com o sistema financeiro

OWNS: index.html, src/styles/tokens.css, src/components/layout/Sidebar.jsx, src/components/layout/Sidebar.css, src/components/dashboard/KpiCard.jsx, src/components/dashboard/KpiCard.css, src/components/dashboard/DashboardKpis.jsx

Scope: usuário pediu pra alinhar a identidade visual da Agenda-Psicologa com a do outro sistema dele (sistema-financeiro-familiar/app), a partir de 2 prints comparando as telas. Cores da paleta clara e do sidebar escuro já batiam 100% (commit 69dbdcd, dois dias antes) — o print comparado vinha de uma aba com cache antigo, confirmado abrindo o site publicado numa aba nova. Ficaram 3 diferenças reais, e o usuário pediu pra seguir com 2 delas (pulando o cartão de destaque em gradiente):

1. Menu lateral sem agrupamento (financeiro separa em rótulos PRINCIPAL/MOVIMENTAÇÕES/PLANEJAMENTO/SISTEMA) — agrupado agora em Principal/Atendimento/Gestão/Sistema.
2. Ícones dos KPIs do dashboard sem badge colorido (financeiro usa um quadrado 34px com 12% de opacidade da cor semântica) — adicionado via prop `corIcone` (primaria/sucesso/perigo/info) em KpiCard.
3. Tipografia divergente: Agenda usava Instrument Sans + JetBrains Mono; financeiro usa Plus Jakarta Sans + IBM Plex Mono — trocado o link do Google Fonts e os tokens `--font-body`/`--font-display`/`--font-mono` pra igualar.

Fora do escopo (pulado a pedido do usuário): cartão de KPI em gradiente roxo→rosa (destaque) como o "Saldo Acumulado" do financeiro.

- [x] G1: fontes trocadas para as mesmas do sistema financeiro (Plus Jakarta Sans + IBM Plex Mono), sem sobra de Instrument Sans/JetBrains Mono
  CHECK: node -e "const h=require('fs').readFileSync('index.html','utf8'); const t=require('fs').readFileSync('src/styles/tokens.css','utf8'); for (const s of ['Instrument+Sans','Instrument Sans','JetBrains Mono']) if (h.includes(s)||t.includes(s)) throw new Error('sobrou: '+s); if (!h.includes('Plus+Jakarta+Sans')||!h.includes('IBM+Plex+Mono')) throw new Error('faltando no index.html'); if (!t.includes('Plus Jakarta Sans')||!t.includes('IBM Plex Mono')) throw new Error('faltando nos tokens'); console.log('FONTES_OK')"
  EXPECT: FONTES_OK

- [x] G2: KpiCard aceita `corIcone` e os 4 KPIs do dashboard passam uma cor semântica (mesmo modelo do StatCard do financeiro)
  CHECK: node -e "const jsx=require('fs').readFileSync('src/components/dashboard/KpiCard.jsx','utf8'); const css=require('fs').readFileSync('src/components/dashboard/KpiCard.css','utf8'); const kpis=require('fs').readFileSync('src/components/dashboard/DashboardKpis.jsx','utf8'); if(!jsx.includes('corIcone')) throw new Error('KpiCard sem prop corIcone'); for (const c of ['--primaria','--sucesso','--perigo','--info']) if(!css.includes('kpi__icone'+c)) throw new Error('falta variante '+c); const usos=(kpis.match(/corIcone=\"/g)||[]).length; if(usos<4) throw new Error('esperado 4 usos de corIcone, achou '+usos); console.log('BADGES_OK')"
  EXPECT: BADGES_OK

- [x] G3: menu lateral agrupado por seção (mesmo formato do financeiro: rótulo em versalete acima de cada bloco)
  CHECK: node -e "const jsx=require('fs').readFileSync('src/components/layout/Sidebar.jsx','utf8'); const css=require('fs').readFileSync('src/components/layout/Sidebar.css','utf8'); if(!/GRUPOS\s*=/.test(jsx)) throw new Error('sem GRUPOS'); if(!jsx.includes('sidebar__grupo-titulo')) throw new Error('sem titulo de grupo no jsx'); if(!css.includes('.sidebar__grupo-titulo')) throw new Error('sem estilo do titulo de grupo'); console.log('GRUPOS_OK')"
  EXPECT: GRUPOS_OK

- [x] G4: lint limpo, 53 testes passam, build de produção ok
  CHECK: npx oxlint && npm test && npm run build && echo VERIFICACAO_OK
  EXPECT: VERIFICACAO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
