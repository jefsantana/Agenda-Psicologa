-- Migração v11 — remove a tabela `agendamentos` (morta desde a v2)
--
-- Como usar: cole no SQL Editor do Supabase e clique em Run. Roda depois do
-- schema_v10_salvar_atendimento_rpc.sql.
--
-- A v1 (`schema.sql`) criou `agendamentos`. A partir da v2 todo o código passou
-- a usar `atendimentos` e `agendamentos` nunca mais foi lido nem escrito.
-- Este script só remove a tabela se ela estiver vazia — se tiver qualquer linha,
-- ele para e avisa, para não apagar dado sem querer.

do $$
declare
  n bigint;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'agendamentos'
  ) then
    raise notice 'Tabela agendamentos já não existe — nada a fazer.';
    return;
  end if;

  execute 'select count(*) from public.agendamentos' into n;
  if n > 0 then
    raise exception 'agendamentos tem % linha(s) — verifique antes de remover', n;
  end if;

  drop table public.agendamentos;
  raise notice 'Tabela agendamentos removida.';
end $$;
