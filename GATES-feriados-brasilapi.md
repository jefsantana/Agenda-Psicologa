# Gates: Sincronização dos feriados nacionais com a BrasilAPI

OWNS: src/lib/feriados.js, src/lib/feriados.test.js, src/lib/feriadosRemotos.js, src/pages/ConfiguracoesPage.jsx

Scope: os feriados nacionais passam a ser buscados na BrasilAPI (`/api/feriados/v1/{ano}`, gratuita, sem chave) para o ano atual e o seguinte, com cache de 7 dias no `localStorage`. A lista oficial entra por cima do cálculo local, que continua como reserva offline e para anos ainda não sincronizados. A sincronização roda uma vez após o login (já era o ponto de entrada de `sincronizarFeriados`). Fora do escopo: feriados municipais automáticos (a BrasilAPI não fornece), escolha de estado, tela de status da sincronização.

- [x] G1: `feriados.js` mescla a lista da BrasilAPI sobre o cálculo e mantém a reserva local
  CHECK: npx vitest run src/lib/feriados.test.js
  EXPECT: Tests  11 passed

- [x] G2: `feriadoEm` prioriza o ano sincronizado e cai no cálculo nos demais anos
  CHECK: node --input-type=module -e "import('./src/lib/feriados.js').then(m=>{m.definirFeriadosNacionaisOnline(2026,[{date:'2026-12-25',name:'Natal (API)'}]); const ok = m.feriadoEm('2026-12-25')==='Natal (API)' && m.feriadoEm('2027-12-25')==='Natal'; m.reiniciarFeriados(); if(!ok || m.feriadoEm('2026-12-25')!=='Natal') throw new Error('prioridade/reset errados'); console.log('PRIORIDADE_OK')})"
  EXPECT: PRIORIDADE_OK

- [x] G3: a busca usa a BrasilAPI com cache no localStorage e é chamada no fluxo de login
  CHECK: node -e "const fs=require('fs'); const r=fs.readFileSync('src/lib/feriadosRemotos.js','utf8'); if(!/brasilapi\.com\.br\/api\/feriados\/v1/.test(r)) throw new Error('endpoint ausente'); if(!/localStorage/.test(r)||!/CACHE_TTL_MS/.test(r)) throw new Error('cache ausente'); const app=fs.readFileSync('src/App.jsx','utf8'); if(!/sincronizarFeriados/.test(app)) throw new Error('login nao sincroniza'); console.log('BRASILAPI_OK')"
  EXPECT: BRASILAPI_OK

- [x] G4: falha de rede é silenciosa — cada busca remota tem try/catch e o sync compõe com Promise.all
  CHECK: node -e "const r=require('fs').readFileSync('src/lib/feriadosRemotos.js','utf8'); const torcatch=(r.match(/catch/g)||[]).length; if(torcatch < 3) throw new Error('poucos catch (esperado >= 3): '+torcatch); if(!/Promise\.all\(\[sincronizarNacionais\(\), sincronizarPersonalizados\(\)\]\)/.test(r)) throw new Error('composicao ausente'); console.log('SILENCIOSO_OK')"
  EXPECT: SILENCIOSO_OK

- [x] G5: lint limpo no escopo + suíte inteira verde + build
  CHECK: npx oxlint src/lib/feriados.js src/lib/feriadosRemotos.js src/pages/ConfiguracoesPage.jsx && npm test && npm run build
  EXPECT: built in
