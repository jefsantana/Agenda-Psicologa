# Gates: Escala e pesos de letra ajustados pro celular/Android

OWNS: src/index.css, src/components/layout/AppShell.css

Scope: usuário perguntou qual formato de letra funciona melhor no celular; respondi que a Plus Jakarta Sans (já em uso) está bem, e o ganho real vem de ajustar escala/peso pro tamanho de tela, não trocar a fonte — usuário pediu pra aplicar isso. Três ajustes, só dentro de `@media (max-width: 640px)` (não muda nada no desktop):

1. `--weight-display` cai de 800 pra 700 no celular — o peso 800 da Plus Jakarta Sans em títulos fica pesado demais numa tela pequena/densidade de pixel mais baixa (Android inclusive).
2. Tracking negativo dos títulos afrouxa de -0.02em/-0.03em pra -0.01em — aperta demais em corpo de texto miúdo. Isso incluiu corrigir `.shell__title` (o título real de cada tela, em `AppShell.css`) que tinha `-0.03em` fixo — a primeira tentativa só no `h1` genérico do `index.css` não pegava porque a classe é mais específica e vence na cascata.
3. `line-height` do body sobe de 1.45 pra 1.5 no celular — mais folga pra leitura em tela pequena.

De caminho, achei e corrigi um bug real de mobile: vários campos de texto do app (ex.: a busca de pacientes, `.pacientes-busca input`) usam `--fs-sm` (13px) — abaixo de 16px, isso força o Safari iOS a dar zoom automático ao focar o campo. Travado pra 16px mínimo só no celular, com `!important` de propósito (é um piso de acessibilidade que precisa vencer o font-size específico de qualquer componente, não uma guerra de especificidade comum).

Validado com o mesmo método CDP do `scripts/verifica-mobile.mjs` (Chrome headless 390px, sessão-stub): confirmei via `getComputedStyle` que o h1 real da tela de Pacientes saiu com `font-weight: 700`, `letter-spacing: -0.22px` (= -0.01em em 22px) e a busca com `font-size: 16px` — os três batendo com o esperado. Rodei também o `verifica-mobile.mjs` do projeto; o aviso "☰ do cabeçalho ausente" já existia sem essas mudanças (confirmado com `git stash` e reexecução), não é regressão deste slice.

- [x] G1: peso e tracking de título reduzidos só no celular, sem afetar desktop
  CHECK: node -e "const i=require('fs').readFileSync('src/index.css','utf8'); const a=require('fs').readFileSync('src/components/layout/AppShell.css','utf8'); if(!/max-width:\s*640px\)\s*{\s*:root\s*{\s*--weight-display:\s*700/.test(i.replace(/\n/g,' '))) throw new Error('peso 700 mobile ausente'); if(!/max-width:\s*640px\)\s*{\s*\.shell__title\s*{\s*letter-spacing:\s*-0.01em/.test(a.replace(/\n/g,' '))) throw new Error('tracking do shell__title nao ajustado no mobile'); console.log('TITULO_MOBILE_OK')"
  EXPECT: TITULO_MOBILE_OK

- [x] G2: line-height do corpo sobe no celular
  CHECK: node -e "const i=require('fs').readFileSync('src/index.css','utf8'); if(!/max-width:\s*640px\)\s*{\s*:root\s*{\s*--weight-display:\s*700;\s*}\s*h1,\s*h2,\s*h3,\s*h4\s*{\s*letter-spacing:\s*-0.01em;\s*}\s*body\s*{\s*line-height:\s*1.5/.test(i.replace(/\n/g,' '))) throw new Error('line-height 1.5 ausente no bloco mobile'); console.log('LINEHEIGHT_OK')"
  EXPECT: LINEHEIGHT_OK

- [x] G3: campos de texto travados em 16px mínimo no celular (evita zoom automático do Safari iOS)
  CHECK: node -e "const i=require('fs').readFileSync('src/index.css','utf8'); if(!/font-size:\s*16px\s*!important/.test(i)) throw new Error('piso de 16px ausente'); console.log('INPUT_16PX_OK')"
  EXPECT: INPUT_16PX_OK

- [x] G4: lint limpo, 53 testes passam, build de produção ok
  CHECK: npx oxlint && npm test && npm run build && echo VERIFICACAO_OK
  EXPECT: VERIFICACAO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
