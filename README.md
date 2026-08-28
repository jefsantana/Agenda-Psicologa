# Espaço Raquel Fróis

Sistema de agenda, atendimentos e prontuário eletrônico de uso exclusivo da
psicóloga Raquel Fróis. React (Vite) + Supabase.

---

## Rodar no computador (desenvolvimento)

1. Instalar o [Node.js](https://nodejs.org) versão 20 ou mais nova.
2. No terminal, dentro da pasta do projeto:
   ```
   npm install
   ```
3. Copiar `.env.example` para `.env.local` e preencher com os dados do projeto
   Supabase (Painel → Settings → API):
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
   ```
   O `.env.local` nunca vai para o GitHub (está no `.gitignore`).
4. Iniciar:
   ```
   npm run dev
   ```

Outros comandos: `npm test` (testes), `npm run lint` (revisão de código),
`npm run build` (gera a versão de produção na pasta `dist`).

---

## Configurar o banco (Supabase)

Rodar os arquivos SQL da pasta `supabase/` **na ordem numérica**, um de cada vez,
no SQL Editor do painel (Dashboard → SQL Editor → New query → colar → Run):

```
schema.sql
schema_v2_fase1.sql
schema_v3_prontuario.sql
schema_v4_financeiro.sql
schema_v5_anexos_storage.sql
schema_v6_ajustes.sql
schema_v7_lembretes.sql
schema_v8_seguranca_rls.sql
schema_v9_auditoria_append_only.sql
schema_v10_salvar_atendimento_rpc.sql
```

`seed_dados_teste.sql` e `gerar_agendamentos_teste_ago2026.sql` são **só para
testes** — nunca rodar no banco que vai ter dados reais.

---

## ✅ Checklist de segurança — obrigatório antes de cadastrar qualquer paciente real

Estes passos não são opcionais: o sistema lida com dados de saúde (LGPD + CFP).

1. **Desligar o cadastro público de contas.**
   Painel → Authentication → Providers → Email → **desmarcar "Enable signups"** e salvar.
   Sem isso, qualquer pessoa poderia criar uma conta no projeto. A proteção de
   dados (migração v8) supõe que só existe a conta da psicóloga.

2. **Criar a conta da psicóloga manualmente.**
   Painel → Authentication → Users → "Add user" → e-mail e senha.
   Depois, inserir a linha correspondente em `perfis_profissional` (o `id` é o
   mesmo UUID do usuário criado) — sem essa linha o login funciona mas nenhuma
   tela mostra dados (é a trava da v8).

3. **Rodar a migração `schema_v9_auditoria_append_only.sql`.**
   Deixa a trilha de auditoria à prova de adulteração — nem a própria conta
   consegue apagar ou editar registros de acesso a prontuário.

4. **Senha forte.**
   Usar uma senha longa (12+ caracteres). O formulário de nova senha do app já
   exige no mínimo 10. Opcional: Painel → Authentication → Policies → aumentar o
   comprimento mínimo e ativar "Leaked password protection".

5. **Encurtar a sessão no servidor.**
   Painel → Authentication → Sessions: reduzir o "Access token (JWT) expiry" para
   ~30 min e manter "Refresh token rotation" ligado. O app já desloga sozinho
   após 30 min de inatividade, mas isso só vale no navegador — o ajuste do painel
   é o que invalida o token de fato.

6. **Ao publicar o site**, adicionar o domínio de produção em
   Authentication → URL Configuration → Redirect URLs, senão o link de
   "esqueci minha senha" do e-mail deixa de funcionar.

7. **PDFs de prontuário** são baixados para a pasta Downloads do aparelho, sem
   senha. Não deixar esses arquivos em pastas sincronizadas com nuvem pessoal e
   apagá-los depois de usar.
