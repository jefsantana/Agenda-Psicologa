-- Migração v9 — trilha de auditoria à prova de adulteração (append-only)
--
-- Como usar: cole no SQL Editor do Supabase e clique em Run. Roda depois do
-- schema_v8_seguranca_rls.sql.
--
-- Até aqui `audit_log` tinha policy `for all` — a mesma conta que lê os
-- prontuários também podia UPDATE ou DELETE no próprio registro de acesso.
-- Para servir como trilha LGPD/CFP, o log precisa ser append-only: pode
-- inserir e consultar, nunca alterar nem apagar (nem a psicóloga).

-- 1. Substitui a policy única por duas policies restritas.
drop policy if exists "psicologa_acesso_total" on public.audit_log;

create policy "audit_log_insere" on public.audit_log
  for insert to authenticated
  with check (public.eh_psicologa());

create policy "audit_log_le" on public.audit_log
  for select to authenticated
  using (public.eh_psicologa());

-- (sem policy de UPDATE nem DELETE => essas operações ficam sempre negadas)

-- 2. Remove os privilégios de tabela que permitiam alteração/remoção.
revoke update, delete on table public.audit_log from authenticated;

-- 3. Rede de segurança no nível da tabela: um gatilho recusa qualquer
--    UPDATE/DELETE mesmo que uma policy futura seja adicionada por engano.
create or replace function public.audit_log_imutavel()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log é append-only: % não é permitido', tg_op;
end;
$$;

drop trigger if exists audit_log_sem_alteracao on public.audit_log;
create trigger audit_log_sem_alteracao
  before update or delete on public.audit_log
  for each row execute function public.audit_log_imutavel();
