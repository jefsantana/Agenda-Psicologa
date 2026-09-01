# Revisão técnica — Espaço Raquel Fróis (agenda / prontuário)

Data: 2026-08-27 · Escopo: `main` @ `5659be5` · Stack: React 19 + Vite 8 + Supabase
Base: skills ECC `design-system`, `frontend-a11y`, `accessibility`, `healthcare-phi-compliance`,
`hipaa-compliance`, `react-patterns`, `production-audit`, `verification-loop`.

Estado de build: **36 testes passam**, `oxlint` limpo, `vite build` ok.

---

## Prioridade P0 — resolver antes de inserir dados reais de paciente

> **Status (2026-08-27, branch `revisao-p0-seguranca-contraste`): os 3 itens P0 foram
> aplicados.** Falta a usuária executar os passos de painel do Supabase (itens 1 e 2)
> e rodar a migração v9 no banco — todos documentados no novo `README.md`.

### 1. Cadastro público (signup) precisa estar comprovadamente desligado — ✅ documentado
Toda a segurança de `perfis_profissional` / `eh_psicologa()` (migração v8) depende disso.
- **Feito:** `README.md` reescrito com "Checklist de segurança" — desligar "Enable signups",
  criar a conta manualmente + linha em `perfis_profissional`, senha forte, Redirect URLs.
- **Pendente (usuária):** executar esses passos no painel do Supabase.

### 2. `audit_log` editável/apagável pela própria conta — ✅ corrigido (migração v9)
- **Feito:** `supabase/schema_v9_auditoria_append_only.sql` — troca a policy `for all` por
  `for insert` + `for select` (ambas `eh_psicologa()`), `revoke update, delete`, e um gatilho
  `before update or delete` que recusa qualquer alteração mesmo se uma policy futura reabrir.
- **Pendente (usuária):** rodar a v9 no SQL Editor.

### 3. Contraste do texto secundário abaixo de AA — ✅ corrigido
- **Feito:** `src/styles/tokens.css` — `--text-3` foi de `#7c8494` (~3.9:1) para `#a0a7b8`
  (~7:1); `--text-3-aa` virou alias de `--text-3` (compatibilidade); comentário reforça que
  `--text-4` é só decorativo. As ~13 telas que ainda usavam `--text-3` direto ficam AA sem
  mais edição. `AbaDados.css:44` (botão de remover objetivo) saiu de `--text-4` para `--text-3`.
- Build, lint e os 36 testes seguem passando.

---

## Prioridade P1 — antes de publicar em produção

> **Status (2026-08-27, branch `revisao-p0-seguranca-contraste`): parte de código aplicada.**
> Restam ajustes no painel do Supabase (itens 4 e 8) e rodar a migração v10 no banco.

### 4. Expiração de sessão só existe no cliente — ✅ endurecido no código / painel pendente
- **Feito:** `useInactivityLogout` reescrito — grava o horário da última atividade e
  reconfere ao voltar o foco/aba (`visibilitychange` + `focus`). Um notebook suspenso por
  40 min desloga ao reabrir, em vez de reiniciar o timer.
- **Pendente (usuária):** Painel → Authentication → Sessions → reduzir "Access token (JWT)
  expiry" para ~30 min, manter "Refresh token rotation". Está no `README.md`.

### 5. Auditoria de acesso roda no cliente e é não-bloqueante — ✅ registrado como dívida
- **Feito:** `registrarAuditoria` passou de `getUser()` (request de rede) para `getSession()`
  (lê do storage). Dívida de mover a gravação para o servidor documentada no `PRODUCT.md`.
- `audit_log.ip` continua sem preenchimento — só dá para capturar server-side; entra junto
  com a versão server-side da auditoria.

### 6. Política de senha fraca — ✅ corrigido
- **Feito:** `LoginPage.jsx` (`NovaSenha`) — mínimo passou de 6 para 10 caracteres, com
  mensagem explicando que são dados de saúde. Painel: ativar "Leaked password protection"
  (no `README.md`, opcional).

### 7. Fluxo financeiro sem transação — ✅ corrigido (migração v10)
- **Feito:** `supabase/schema_v10_salvar_atendimento_rpc.sql` — função `salvar_atendimento`
  que grava atendimento + lançamento numa só transação (mantém `pago_em`/`forma` num
  lançamento já existente; remove o lançamento se o valor for apagado). `agenda.js`
  `salvarAtendimento` agora chama `supabase.rpc(...)` — sumiu o `sincronizarLancamento`
  com 3–4 idas ao banco.
- **Pendente (usuária):** rodar a v10 no SQL Editor.

### 8. Redirect URL de recuperação de senha — ✅ documentado
- **Feito:** passo adicionado ao "Checklist de segurança" do `README.md`.
- **Pendente (usuária):** adicionar o domínio de produção em Authentication → URL
  Configuration → Redirect URLs ao publicar.

### 9. PDF de prontuário sai para a pasta Downloads sem cifragem — ✅ documentado
- **Feito:** item 7 do "Checklist de segurança" do `README.md` (não guardar em pasta
  sincronizada com nuvem pessoal, apagar após uso). Sem mudança de código.

---

## Prioridade P2 — qualidade e manutenção

> **Status (2026-08-27, branch `revisao-p0-seguranca-contraste`): 10–14 e 16–19 aplicados.
> 15 vira `supabase/README.md`. 20 fica como decisão em aberto.**

- **10.** ✅ `prontuarioPdf.js` recebe `perfil` e usa `perfil.nome` / `perfil.crp` no cabeçalho
  (cai no valor fixo só se o perfil estiver vazio). `ProntuarioPage` repassa o `perfil` que já
  carregava. `reciboPdf` já usava o perfil.
- **11.** ✅ `pacientes.js` — helper `escaparLike()` escapa `\ % _` antes do `ilike`.
- **12.** ✅ `whatsapp.js` — `(nomePaciente ?? "").trim().split(" ")[0] || "tudo bem"`.
- **13.** ✅ `App.jsx` — `<Suspense fallback={<TelaCarregando />}>` (tela "Carregando…" com
  `role="status"`, tokens do tema).
- **14.** ✅ Migração `schema_v11_remove_agendamentos.sql` — dropa `agendamentos` só se estiver
  vazia; senão para e avisa. **Pendente (usuária):** rodar no SQL Editor.
- **15.** ✅ `supabase/README.md` — tabela da ordem de aplicação + quais arquivos nunca rodar
  em produção. Consolidação num único `.sql` fica registrada como opção futura (adotar o CLI).
- **16.** ✅ `prontuarioPdf.js` e `reciboPdf.js` agora entram por `import()` dinâmico no clique
  dos botões "Gerar PDF" / "Recibo" — `jspdf` + `html2canvas` (176 kB gzip) não carregam mais
  ao abrir as telas de Prontuário / Financeiro.
- **17.** ✅ Placeholders do login trocados para `voce@exemplo.com` e `••••••••`.
- **18.** ✅ `AppShell` seta `document.title` = `"<Tela> · Espaço Raquel Fróis"` por página.
- **19.** ✅ Alvo de toque 44px em `.menu-acoes-linha__botao` (ícone visual mantido) e
  `.login__esqueci`.
- **20.** `HashRouter` gera URLs `/#/hoje`. Ao publicar na Vercel, `BrowserRouter` + rewrites
  dá URLs limpas e melhor compartilhamento — decisão em aberto no `PRODUCT.md`, sem mudança agora.

---

## O que está bem feito (manter)

- Conflito de horário travado no banco por constraint de exclusão GIST, não só na tela
  (`schema.sql:105`; v8 estende a `bloqueios`). Raro de ver bem resolvido.
- Soft-delete + log em evoluções; sem DELETE físico de prontuário; guarda de 5 anos (CFP).
- `apagarPaciente` / `apagarAtendimento` bloqueiam exclusão quando há vínculo ou pagamento.
- 36 testes cobrindo o núcleo de regra (datas, número, financeiro, agenda).
- Tokens de design centralizados e disciplinados, com nota "não inventar valores".
- `:focus-visible` global e `prefers-reduced-motion` tratados no `index.css`.
- `.env.local` e `*.pdf` fora do git; a chave exposta é a *publishable* (correta para client).
