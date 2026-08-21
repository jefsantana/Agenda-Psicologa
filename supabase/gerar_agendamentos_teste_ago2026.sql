-- ==========================================================
-- AGENDAMENTOS ALEATÓRIOS PARA TESTE — até o fim de agosto/2026
-- ==========================================================
-- Gera atendimentos aleatórios, em dias úteis, entre hoje e o fim do mês
-- corrente, distribuídos entre os pacientes já existentes no banco.
-- Não apaga nada; só insere. Se algum horário colidir com um atendimento
-- já existente, aquele horário é simplesmente pulado (ON CONFLICT DO
-- NOTHING), o resto continua normalmente.
--
-- Como usar: Supabase → SQL Editor → New query → colar → Run.
-- Pré-requisito: já existir pelo menos 1 paciente cadastrado (rode
-- seed_dados_teste.sql antes, se a tabela de pacientes estiver vazia).

with dias as (
  select d::date as dia
  from generate_series(
    current_date,
    (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
    interval '1 day'
  ) as d
  where extract(dow from d) not in (0, 6) -- fora domingo/sábado
),
horarios as (
  select hora from (values
    ('08:30'::time), ('09:30'::time), ('10:30'::time), ('11:30'::time),
    ('14:00'::time), ('15:00'::time), ('16:00'::time), ('17:00'::time)
  ) as h(hora)
),
slots_all as (
  select ((dias.dia + horarios.hora) at time zone 'America/Sao_Paulo') as inicio
  from dias
  cross join horarios
),
slots as (
  -- preenche só ~55% dos horários disponíveis, pra ficar realista
  select inicio, row_number() over (order by random()) as rn
  from slots_all
  where random() < 0.55
),
pacientes_num as (
  select
    id, convenio_id, tipo_atendimento_padrao,
    row_number() over (order by random()) as rn,
    count(*) over () as total
  from public.pacientes
)
insert into public.atendimentos (paciente_id, convenio_id, inicio, fim, tipo, status, valor)
select
  p.id,
  p.convenio_id,
  s.inicio,
  s.inicio + interval '50 minutes',
  p.tipo_atendimento_padrao,
  (array['agendado', 'agendado', 'confirmado'])[1 + (s.rn % 3)],
  case when p.convenio_id is not null then 180.00 else 150.00 end
from slots s
join pacientes_num p on p.total > 0 and p.rn = 1 + ((s.rn - 1) % p.total)
on conflict on constraint atendimentos_sem_conflito do nothing;
