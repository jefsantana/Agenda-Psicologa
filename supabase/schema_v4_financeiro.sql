-- Migração v4 — Financeiro
--
-- Como usar: cole no SQL Editor do Supabase e clique em Run. Roda depois do
-- schema_v3_prontuario.sql.
--
-- Um lançamento nasce automaticamente quando um atendimento recebe um
-- valor (a tela de Agenda/Atendimentos faz isso pelo código, não por
-- trigger). O status (pago/pendente/atrasado) não é uma coluna: é
-- calculado a partir de `pago_em` e `vencimento` — assim nunca fica
-- desatualizado.

create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  atendimento_id uuid not null unique references public.atendimentos (id) on delete cascade,
  valor numeric(10, 2) not null,
  vencimento date not null,
  pago_em timestamptz,
  forma text,
  created_at timestamptz not null default now()
);

alter table public.lancamentos enable row level security;

create policy "psicologa_acesso_total" on public.lancamentos
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.lancamentos to authenticated;

create index lancamentos_por_vencimento on public.lancamentos (vencimento);
