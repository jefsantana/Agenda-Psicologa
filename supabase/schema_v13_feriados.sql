-- Migração v13 — Feriados e recessos personalizados
--
-- Como usar: cole no SQL Editor do Supabase e clique em Run. Roda depois do
-- schema_v12_gad7.sql.
--
-- Os feriados NACIONAIS continuam calculados no cliente (src/lib/feriados.js),
-- sem depender do banco. Esta tabela guarda só o que varia por cidade/estado
-- ou é decisão da própria clínica: feriado municipal, feriado estadual,
-- recesso, ponto facultativo. O calendário e os formulários da agenda passam
-- a marcar essas datas junto com as nacionais.
--
-- `repete_todo_ano`: quando true, só o mês-dia importa (ex.: aniversário da
-- cidade, todo 25/01). Quando false, vale só naquele ano (ex.: recesso de
-- 26/12/2026).

create table if not exists public.feriados (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  nome text not null,
  abrangencia text not null default 'personalizado'
    check (abrangencia in ('municipal', 'estadual', 'personalizado')),
  repete_todo_ano boolean not null default false,
  criado_em timestamptz not null default now(),
  constraint feriados_nome_nao_vazio check (length(btrim(nome)) > 0)
);

create unique index if not exists feriados_data_nome_idx
  on public.feriados (data, lower(nome));

alter table public.feriados enable row level security;

create policy "psicologa_acesso_total" on public.feriados
  for all to authenticated using (public.eh_psicologa()) with check (public.eh_psicologa());

grant select, insert, update, delete on table public.feriados to authenticated;
