-- Migração v8 — travar RLS na conta da psicóloga + conflito em bloqueios
--
-- Como usar: cole no SQL Editor do Supabase e clique em Run. Roda depois do
-- schema_v7_lembretes.sql.
--
-- Até aqui toda policy era `using (true) with check (true)`, ou seja,
-- QUALQUER conta autenticada no projeto Supabase (não só a psicóloga)
-- teria acesso total a pacientes, prontuários e financeiro. A segurança
-- real dependia inteiramente do cadastro público estar desligado no
-- painel. Esta migração amarra todas as policies a
-- `auth.uid() = id da psicóloga em perfis_profissional`, então mesmo que
-- uma segunda conta seja criada por engano, ela não enxerga nada.

create or replace function public.eh_psicologa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis_profissional p where p.id = auth.uid()
  );
$$;

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'convenios', 'pacientes', 'configuracoes_agenda', 'perfis_profissional',
    'bloqueios', 'atendimentos', 'prontuarios', 'evolucoes', 'objetivos',
    'anexos', 'tarefas', 'audit_log', 'lancamentos'
  ]
  loop
    execute format('drop policy if exists "psicologa_acesso_total" on public.%I', tabela);
    execute format(
      'create policy "psicologa_acesso_total" on public.%I for all to authenticated using (public.eh_psicologa()) with check (public.eh_psicologa())',
      tabela
    );
  end loop;
end $$;

drop policy if exists "psicologa_le_anexos" on storage.objects;
create policy "psicologa_le_anexos" on storage.objects
  for select to authenticated
  using (bucket_id = 'prontuario-anexos' and public.eh_psicologa());

drop policy if exists "psicologa_envia_anexos" on storage.objects;
create policy "psicologa_envia_anexos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'prontuario-anexos' and public.eh_psicologa());

drop policy if exists "psicologa_apaga_anexos" on storage.objects;
create policy "psicologa_apaga_anexos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'prontuario-anexos' and public.eh_psicologa());

-- ==========================================================
-- BLOQUEIOS — mesma proteção contra sobreposição que já existe em
-- atendimentos (item pendente desde o schema_v2).
-- ==========================================================
alter table public.bloqueios
  add constraint bloqueios_sem_conflito
  exclude using gist (tstzrange(inicio, fim) with &&);
