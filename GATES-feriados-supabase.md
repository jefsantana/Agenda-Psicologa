# Gates: Feriados personalizados via Supabase (municipal/estadual/recesso)

OWNS: supabase/schema_v13_feriados.sql, src/lib/feriados.js, src/lib/feriados.test.js, src/lib/feriadosRemotos.js, src/App.jsx, src/pages/ConfiguracoesPage.jsx, src/pages/ConfiguracoesPage.css

Scope: complementa a fatia "feriados-calendario". Os feriados NACIONAIS seguem calculados no cliente. Esta fatia adiciona uma tabela `feriados` no Supabase (migração v13, RLS `eh_psicologa`) para feriados municipais/estaduais e recessos da clínica, uma seção "Feriados e recessos" em Configurações (listar/adicionar/remover) e a sincronização automática após o login. `feriadoEm` passa a considerar os dois conjuntos, sem deixar de ser síncrono (cache de módulo). Fora do escopo: importar feriados de API externa, feriados por profissional/unidade, edição em massa.

- [x] G1: migração v13 aplicada — tabela `public.feriados` existe com RLS
  CHECK: (arquivo) grep -q "create table if not exists public.feriados" supabase/schema_v13_feriados.sql && grep -q "enable row level security" supabase/schema_v13_feriados.sql && echo V13_OK
  EXPECT: V13_OK

- [x] G2: `feriadoEm` combina nacional + personalizado e o nacional vence empate
  CHECK: npx vitest run src/lib/feriados.test.js
  EXPECT: Tests  8 passed

- [x] G3: `feriados.js` continua sem importar o Supabase (testável em node puro)
  CHECK: node -e "const c=require('fs').readFileSync('src/lib/feriados.js','utf8'); if(/^\s*import\b/m.test(c)) throw new Error('feriados.js nao deve ter imports'); if(!/definirFeriadosPersonalizados/.test(c)) throw new Error('setter ausente'); console.log('PURO_OK')"
  EXPECT: PURO_OK

- [x] G4: a sincronização roda após o login (App.jsx) e a CRUD existe
  CHECK: node -e "const fs=require('fs'); const app=fs.readFileSync('src/App.jsx','utf8'); if(!/sincronizarFeriados/.test(app)) throw new Error('App nao sincroniza'); const r=fs.readFileSync('src/lib/feriadosRemotos.js','utf8'); if(!/criarFeriado/.test(r)||!/apagarFeriado/.test(r)||!/buscarFeriadosPersonalizados/.test(r)) throw new Error('CRUD incompleta'); console.log('SYNC_CRUD_OK')"
  EXPECT: SYNC_CRUD_OK

- [x] G5: Configurações tem a seção "Feriados e recessos"
  CHECK: node -e "const c=require('fs').readFileSync('src/pages/ConfiguracoesPage.jsx','utf8'); if(!/SecaoFeriados/.test(c)||!/Feriados e recessos/.test(c)) throw new Error('secao ausente'); console.log('CONFIG_OK')"
  EXPECT: CONFIG_OK

- [x] G6: lint limpo no escopo + suíte inteira verde + build
  CHECK: npx oxlint src/lib/feriados.js src/lib/feriadosRemotos.js src/App.jsx src/pages/ConfiguracoesPage.jsx && npm test && npm run build
  EXPECT: built in
