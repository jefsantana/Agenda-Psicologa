-- Schema do Sistema de Agendamento — Dra. Raquel Frois
--
-- Como usar: cole este arquivo inteiro no SQL Editor do painel do Supabase
-- (Dashboard > SQL Editor > New query) e clique em "Run". Só precisa
-- rodar uma vez, na criação do projeto.
--
-- Modelo de acesso: usuária única (a psicóloga). Todas as tabelas ficam
-- com RLS ligado e uma única política "quem está logado pode tudo" —
-- isso é seguro aqui porque nenhuma tela de cadastro público existe;
-- o único usuário autenticado é criado manualmente no painel.

-- ==========================================================
-- CONVÊNIOS
-- ==========================================================
create table public.convenios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.convenios enable row level security;

create policy "psicologa_acesso_total" on public.convenios
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on table public.convenios to authenticated;

insert into public.convenios (nome) values ('Unimed'), ('Particular');

-- ==========================================================
-- PACIENTES
-- ==========================================================
create table public.pacientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  telefone text,
  convenio_id uuid references public.convenios (id) on delete set null,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pacientes enable row level security;

create policy "psicologa_acesso_total" on public.pacientes
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on table public.pacientes to authenticated;

-- ==========================================================
-- CONFIGURAÇÕES DA AGENDA (uma linha por dia da semana)
-- ==========================================================
create table public.configuracoes_agenda (
  id uuid primary key default gen_random_uuid(),
  dia_semana smallint not null unique check (dia_semana between 0 and 6), -- 0 = domingo … 6 = sábado
  ativo boolean not null default true,
  hora_inicio time not null default '08:00',
  hora_fim time not null default '18:00',
  duracao_padrao_minutos smallint not null default 50
);

alter table public.configuracoes_agenda enable row level security;

create policy "psicologa_acesso_total" on public.configuracoes_agenda
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on table public.configuracoes_agenda to authenticated;

insert into public.configuracoes_agenda (dia_semana, ativo) values
  (0, false), (1, true), (2, true), (3, true), (4, true), (5, true), (6, false);

-- ==========================================================
-- AGENDAMENTOS
-- ==========================================================
create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete restrict,
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  tipo_atendimento text not null check (tipo_atendimento in ('online', 'presencial')),
  status text not null default 'agendado'
    check (status in ('agendado', 'realizado', 'cancelado', 'reagendado')),
  observacoes text,
  created_at timestamptz not null default now(),
  -- período calculado, usado só para travar conflito de horário
  periodo tsrange generated always as (
    tsrange(data + hora_inicio, data + hora_fim)
  ) stored,
  constraint hora_fim_depois_do_inicio check (hora_fim > hora_inicio)
);

-- Impede dois agendamentos com horários sobrepostos (ignora os cancelados)
alter table public.agendamentos
  add constraint agendamentos_sem_conflito
  exclude using gist (periodo with &&)
  where (status <> 'cancelado');

alter table public.agendamentos enable row level security;

create policy "psicologa_acesso_total" on public.agendamentos
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on table public.agendamentos to authenticated;

create index agendamentos_por_data on public.agendamentos (data);
create index agendamentos_por_paciente on public.agendamentos (paciente_id);

-- ==========================================================
-- PRONTUÁRIOS
-- Os campos exatos dependem do modelo que a Dra. Raquel vai anexar;
-- por isso ficam num campo flexível (jsonb) por enquanto.
-- ==========================================================
create table public.prontuarios (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  conteudo jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.prontuarios enable row level security;

create policy "psicologa_acesso_total" on public.prontuarios
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on table public.prontuarios to authenticated;

create unique index prontuarios_por_paciente on public.prontuarios (paciente_id);

-- ==========================================================
-- LANÇAMENTOS UNIMED (para exportação em Excel por período)
-- ==========================================================
create table public.unimed_lancamentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete restrict,
  senha text not null,
  cartao text not null,
  data_execucao date not null,
  email_cliente text,
  exportado boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.unimed_lancamentos enable row level security;

create policy "psicologa_acesso_total" on public.unimed_lancamentos
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on table public.unimed_lancamentos to authenticated;

create index unimed_lancamentos_por_data on public.unimed_lancamentos (data_execucao);
