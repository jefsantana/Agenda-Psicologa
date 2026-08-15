-- Migração v2 — Fase 1 (dashboard, agenda/atendimentos, pacientes, prontuário)
--
-- Como usar: cole este arquivo inteiro no SQL Editor do painel do Supabase
-- (Dashboard > SQL Editor > New query) e clique em "Run". Roda depois do
-- schema.sql original — não precisa recriar o projeto do zero.
--
-- Isso substitui a tabela `agendamentos` por `atendimentos` (modelo mais
-- rico: horário como intervalo, status ampliado, valor, recorrência).
-- Como só existiam agendamentos de teste até agora, a tabela antiga é
-- apagada sem problema. Prontuário ganha estrutura própria (evoluções
-- versionadas, objetivos, anexos) no lugar do campo único em JSON.

-- ==========================================================
-- PACIENTES — novos campos
-- ==========================================================
alter table public.pacientes add column if not exists nascimento date;
alter table public.pacientes add column if not exists cpf text;
alter table public.pacientes add column if not exists carteirinha text;
alter table public.pacientes add column if not exists responsavel text;
alter table public.pacientes add column if not exists consentimento_em timestamptz;
alter table public.pacientes add column if not exists status text not null default 'novo'
  check (status in ('ativo', 'pendente', 'novo', 'inativo'));

-- ==========================================================
-- CONVÊNIOS — campos financeiros (usados só na Fase 2, mas fazem parte do
-- modelo de dados combinado; ficam nulos por enquanto)
-- ==========================================================
alter table public.convenios add column if not exists valor_sessao numeric(10, 2);
alter table public.convenios add column if not exists prazo_repasse_dias smallint;
alter table public.convenios add column if not exists teto_mensal smallint;

-- ==========================================================
-- PERFIL DA PROFISSIONAL (nome, CRP — para o cabeçalho e rodapé da sidebar)
-- ==========================================================
create table if not exists public.perfis_profissional (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  crp text,
  plano text not null default 'trial',
  expira_em date,
  meta_mensal numeric(10, 2) not null default 6000
);

alter table public.perfis_profissional enable row level security;

create policy "psicologa_acesso_total" on public.perfis_profissional
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.perfis_profissional to authenticated;

-- ==========================================================
-- BLOQUEIOS DE AGENDA (intervalos, férias)
-- ==========================================================
create table if not exists public.bloqueios (
  id uuid primary key default gen_random_uuid(),
  inicio timestamptz not null,
  fim timestamptz not null,
  motivo text,
  constraint bloqueio_fim_depois_inicio check (fim > inicio)
);

alter table public.bloqueios enable row level security;

create policy "psicologa_acesso_total" on public.bloqueios
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.bloqueios to authenticated;

-- ==========================================================
-- ATENDIMENTOS (substitui `agendamentos`)
-- ==========================================================
drop table if exists public.agendamentos cascade;

create table public.atendimentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete restrict,
  convenio_id uuid references public.convenios (id) on delete set null,
  inicio timestamptz not null,
  fim timestamptz not null,
  tipo text not null check (tipo in ('online', 'presencial')),
  status text not null default 'agendado'
    check (status in ('agendado', 'aguardando', 'confirmado', 'remarcar', 'realizado', 'falta', 'cancelado')),
  valor numeric(10, 2),
  recorrencia_id uuid,
  confirmado_em timestamptz,
  created_at timestamptz not null default now(),
  constraint atendimento_fim_depois_inicio check (fim > inicio)
);

-- Impede sobreposição de horário (ignora cancelados e faltas)
alter table public.atendimentos
  add constraint atendimentos_sem_conflito
  exclude using gist (tstzrange(inicio, fim) with &&)
  where (status not in ('cancelado', 'falta'));

alter table public.atendimentos enable row level security;

create policy "psicologa_acesso_total" on public.atendimentos
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.atendimentos to authenticated;

create index atendimentos_por_inicio on public.atendimentos (inicio);
create index atendimentos_por_paciente on public.atendimentos (paciente_id);

-- ==========================================================
-- PRONTUÁRIO — reestruturado: 1 prontuário por paciente, evoluções
-- versionadas (sem exclusão física), objetivos e anexos separados.
-- ==========================================================
drop table if exists public.prontuarios cascade;

create table public.prontuarios (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null unique references public.pacientes (id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.prontuarios enable row level security;

create policy "psicologa_acesso_total" on public.prontuarios
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.prontuarios to authenticated;

create table public.evolucoes (
  id uuid primary key default gen_random_uuid(),
  prontuario_id uuid not null references public.prontuarios (id) on delete cascade,
  atendimento_id uuid references public.atendimentos (id) on delete set null,
  modelo text not null default 'livre' check (modelo in ('soap', 'livre')),
  conteudo text not null,
  versao int not null default 1,
  autor_id uuid not null references auth.users (id),
  criado_em timestamptz not null default now(),
  apagado_em timestamptz -- soft delete; nunca DELETE físico
);

alter table public.evolucoes enable row level security;

create policy "psicologa_acesso_total" on public.evolucoes
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.evolucoes to authenticated;

create table public.objetivos (
  id uuid primary key default gen_random_uuid(),
  prontuario_id uuid not null references public.prontuarios (id) on delete cascade,
  titulo text not null,
  concluido_em timestamptz
);

alter table public.objetivos enable row level security;

create policy "psicologa_acesso_total" on public.objetivos
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.objetivos to authenticated;

create table public.anexos (
  id uuid primary key default gen_random_uuid(),
  prontuario_id uuid not null references public.prontuarios (id) on delete cascade,
  nome text not null,
  mime text not null,
  tamanho_bytes bigint not null,
  caminho_storage text not null,
  criado_em timestamptz not null default now(),
  constraint anexo_tamanho_maximo check (tamanho_bytes <= 20 * 1024 * 1024) -- 20 MB
);

alter table public.anexos enable row level security;

create policy "psicologa_acesso_total" on public.anexos
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.anexos to authenticated;

-- ==========================================================
-- TAREFAS (lembretes do dashboard)
-- ==========================================================
create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  paciente_id uuid references public.pacientes (id) on delete set null,
  vence_em date,
  concluida_em timestamptz
);

alter table public.tarefas enable row level security;

create policy "psicologa_acesso_total" on public.tarefas
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.tarefas to authenticated;

-- ==========================================================
-- TRILHA DE AUDITORIA (LGPD) — registrada pelo código da aplicação
-- (leitura de prontuário não gera trigger no Postgres; o app grava a
-- linha explicitamente ao abrir um prontuário ou salvar uma evolução).
-- Convenção: nunca oferecer editar/apagar auditoria na interface.
-- ==========================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  ator_id uuid not null references auth.users (id),
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  ip text,
  criado_em timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "psicologa_acesso_total" on public.audit_log
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on table public.audit_log to authenticated;

create index audit_log_por_entidade on public.audit_log (entidade, entidade_id);
