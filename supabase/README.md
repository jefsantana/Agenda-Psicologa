# Banco de dados (Supabase)

## Ordem de aplicação

Rodar **um arquivo de cada vez**, na ordem numérica, no SQL Editor do painel
(Dashboard → SQL Editor → New query → colar → Run):

| Arquivo | O que faz |
|---|---|
| `schema.sql` | Tabelas base (v1) |
| `schema_v2_fase1.sql` | Perfil, bloqueios, prontuário, evoluções, objetivos, auditoria |
| `schema_v3_prontuario.sql` | Campos clínicos do prontuário |
| `schema_v4_financeiro.sql` | Lançamentos financeiros |
| `schema_v5_anexos_storage.sql` | Anexos (bucket de storage) |
| `schema_v6_ajustes.sql` | Ajustes de colunas |
| `schema_v7_lembretes.sql` | Lembretes agendados (`pg_cron`) |
| `schema_v8_seguranca_rls.sql` | RLS travada na conta da psicóloga (`eh_psicologa()`) |
| `schema_v9_auditoria_append_only.sql` | `audit_log` à prova de adulteração |
| `schema_v10_salvar_atendimento_rpc.sql` | Atendimento + lançamento numa transação |
| `schema_v11_remove_agendamentos.sql` | Remove a tabela `agendamentos` (morta desde a v2) |
| `schema_v12_gad7.sql` | Escala GAD-7 por sessão (`avaliacoes_gad7`) |

Cada arquivo é a fonte de verdade daquela mudança — este projeto **não** mantém
um `schema_completo.sql` consolidado; para recriar o banco do zero, rodar todos
na ordem. (Alternativa futura: adotar o `supabase` CLI e `supabase db diff`.)

## Arquivos que NÃO devem rodar em produção

- `seed_dados_teste.sql`
- `gerar_agendamentos_teste_ago2026.sql`

São dados sintéticos só para desenvolvimento.
