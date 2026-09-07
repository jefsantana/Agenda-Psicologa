-- Migração v12 — Escala GAD-7 por sessão + reativação da evolução por texto livre
--
-- Como usar: cole no SQL Editor do Supabase e clique em Run. Roda depois do
-- schema_v11_remove_agendamentos.sql.
--
-- Contexto: a tabela `evolucoes` já existe desde a v2 (versionada, sem
-- exclusão física), mas o app nunca chegou a usá-la — o registro de evolução
-- por texto livre foi substituído por uma linha do tempo de presença
-- (ver comentário em src/lib/prontuario.js). Esta migração NÃO altera essa
-- tabela; só adiciona a escala GAD-7, nova.
--
-- GAD-7 (Generalized Anxiety Disorder 7-item scale, Spitzer/Kroenke/Williams
-- 2006) é um instrumento de domínio público: 7 perguntas, cada uma de 0
-- ("nenhuma vez") a 3 ("quase todos os dias") sobre as últimas 2 semanas.
-- Pontuação total de 0 a 21. `respostas` guarda as 7 notas na ordem oficial
-- do instrumento; `pontuacao` é calculada pelo banco para nunca divergir da
-- soma real.
create table if not exists public.avaliacoes_gad7 (
  id uuid primary key default gen_random_uuid(),
  atendimento_id uuid not null references public.atendimentos (id) on delete cascade,
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  respostas smallint[] not null,
  pontuacao smallint generated always as (
    respostas[1] + respostas[2] + respostas[3] + respostas[4] +
    respostas[5] + respostas[6] + respostas[7]
  ) stored,
  autor_id uuid not null references auth.users (id) default auth.uid(),
  criado_em timestamptz not null default now(),
  constraint avaliacoes_gad7_7_respostas check (array_length(respostas, 1) = 7),
  constraint avaliacoes_gad7_notas_0_a_3 check (
    respostas[1] between 0 and 3 and respostas[2] between 0 and 3 and
    respostas[3] between 0 and 3 and respostas[4] between 0 and 3 and
    respostas[5] between 0 and 3 and respostas[6] between 0 and 3 and
    respostas[7] between 0 and 3
  )
);

alter table public.avaliacoes_gad7 enable row level security;

create policy "psicologa_acesso_total" on public.avaliacoes_gad7
  for all to authenticated using (public.eh_psicologa()) with check (public.eh_psicologa());

grant select, insert, update, delete on table public.avaliacoes_gad7 to authenticated;

create index if not exists avaliacoes_gad7_paciente_id_idx on public.avaliacoes_gad7 (paciente_id, criado_em desc);

-- ==========================================================
-- Reativação da evolução por texto livre (tabela já existia, só não era
-- usada pelo app). RLS e grants já foram aplicados na v8/v2 — nada a mudar
-- aqui, é só documentação de que a v13+ do app volta a escrever nela.
-- ==========================================================
