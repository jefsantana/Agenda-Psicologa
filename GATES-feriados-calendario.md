# Gates: Feriados nacionais no calendário e nos formulários da agenda

OWNS: src/lib/feriados.js, src/lib/feriados.test.js, src/components/dashboard/CalendarioMes.jsx, src/components/dashboard/CalendarioMes.css, src/components/agenda/BloqueioForm.jsx, src/components/agenda/AtendimentoForm.jsx, src/styles/sheet.css

Scope: marcar os feriados nacionais brasileiros no `CalendarioMes` (número em azul + tint + tooltip com o nome + item na legenda) e mostrar um aviso não-bloqueante ("Feriado nacional: Natal") ao escolher uma data de feriado em `AtendimentoForm` e `BloqueioForm`. Os feriados são calculados localmente, sem chamada de rede — fixos por lei federal + móveis derivados da Páscoa (Carnaval, Sexta-feira Santa, Corpus Christi). Fora do escopo: feriados estaduais/municipais, pontos facultativos, lista editável em Configurações, bloquear o salvamento.

- [x] G1: `feriados.js` calcula os feriados fixos e os móveis (Páscoa) para qualquer ano
  CHECK: node -e "const {feriadosDoAno}=require('./src/lib/feriados.js')" 2>/dev/null || node --input-type=module -e "import('./src/lib/feriados.js').then(m=>{const f=m.feriadosDoAno(2026); const g=m.feriadosDoAno(2025); const ok=f.get('2026-12-25')==='Natal'&&f.get('2026-04-03')==='Sexta-feira Santa'&&f.get('2026-06-04')==='Corpus Christi'&&g.get('2025-04-18')==='Sexta-feira Santa'&&g.get('2025-03-04')==='Carnaval'; if(!ok) throw new Error('datas erradas'); console.log('FERIADOS_OK')})"
  EXPECT: FERIADOS_OK

- [x] G2: os testes de `feriados` passam junto com a suíte
  CHECK: npx vitest run src/lib/feriados.test.js
  EXPECT: Test Files  1 passed

- [x] G3: `CalendarioMes` marca o dia de feriado (classe + tooltip) e cita `feriadoEm`
  CHECK: node -e "const c=require('fs').readFileSync('src/components/dashboard/CalendarioMes.jsx','utf8'); if(!/feriadoEm/.test(c)||!/calendario__dia--feriado/.test(c)||!/title=\{nomeFeriado/.test(c)) throw new Error('marca de feriado ausente'); console.log('CAL_FERIADO_OK')"
  EXPECT: CAL_FERIADO_OK

- [x] G4: `AtendimentoForm` e `BloqueioForm` mostram o aviso de feriado (não-bloqueante)
  CHECK: node -e "const fs=require('fs'); for (const p of ['src/components/agenda/AtendimentoForm.jsx','src/components/agenda/BloqueioForm.jsx']) { const c=fs.readFileSync(p,'utf8'); if(!/feriadoEm\(data\)/.test(c)||!/sheet__aviso/.test(c)) throw new Error('aviso ausente em '+p); } console.log('AVISO_FERIADO_OK')"
  EXPECT: AVISO_FERIADO_OK

- [x] G5: lint limpo nos arquivos do escopo e a suíte inteira continua verde
  CHECK: npx oxlint src/lib/feriados.js src/components/dashboard/CalendarioMes.jsx src/components/agenda/AtendimentoForm.jsx src/components/agenda/BloqueioForm.jsx && npm test
  EXPECT: Tests  {N} passed

- [x] G6: `vite build` passa
  CHECK: npm run build
  EXPECT: built in
