-- Migração v3 — campos do Prontuário de Atendimento (impressão/assinatura em PDF)
--
-- Como usar: cole no SQL Editor do Supabase e clique em Run. Roda depois do
-- schema_v2_fase1.sql. Só adiciona colunas novas (ADD COLUMN IF NOT EXISTS),
-- não apaga nada existente.

-- ==========================================================
-- PACIENTES — dados demográficos preenchidos no cadastro, reaproveitados
-- automaticamente na geração do prontuário.
-- ==========================================================
alter table public.pacientes add column if not exists sexo text;
alter table public.pacientes add column if not exists estado_civil text;
alter table public.pacientes add column if not exists filiacao text;
alter table public.pacientes add column if not exists escolaridade text;
alter table public.pacientes add column if not exists profissao text;
alter table public.pacientes add column if not exists rg text;
alter table public.pacientes add column if not exists endereco text;
alter table public.pacientes add column if not exists data_inicio_terapia date;

-- ==========================================================
-- PRONTUARIOS — campos clínicos e do profissional responsável.
-- ==========================================================
alter table public.prontuarios add column if not exists motivo_consulta text;
alter table public.prontuarios add column if not exists encaminhado_por text;
alter table public.prontuarios add column if not exists avaliacao_objetivo text;
alter table public.prontuarios add column if not exists data_termino_terapia date;
alter table public.prontuarios add column if not exists motivo_termino text
  check (motivo_termino is null or motivo_termino in ('desistente', 'concluido'));
alter table public.prontuarios add column if not exists tipo_profissional text not null default 'psicologo'
  check (tipo_profissional in ('psicologo', 'to', 'fonoaudiologo', 'fisioterapeuta', 'outro'));
alter table public.prontuarios add column if not exists nome_profissional text;
alter table public.prontuarios add column if not exists numero_conselho text;
