-- ==========================================================
-- AJUSTES DE UX (agosto/2026)
-- Tipo de atendimento padrão do paciente (evita perguntar de novo a cada
-- agendamento rápido) e faixa etária (para refletir que a psicóloga atende
-- público masculino, feminino e infantil).
-- ==========================================================
alter table public.pacientes add column if not exists tipo_atendimento_padrao text not null default 'presencial'
  check (tipo_atendimento_padrao in ('presencial', 'online'));

alter table public.pacientes add column if not exists faixa_etaria text
  check (faixa_etaria in ('adulto', 'adolescente', 'crianca'));
