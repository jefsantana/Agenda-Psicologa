-- ==========================================================
-- RESET + DADOS SINTÉTICOS PARA TESTE (agosto/2026)
-- ==========================================================
-- ATENÇÃO — ISTO APAGA PERMANENTEMENTE:
--   pacientes, atendimentos, bloqueios, tarefas, lançamentos,
--   prontuários (evoluções/objetivos/anexos), trilha de auditoria
--   e convênios atuais.
-- NÃO apaga: seu login, o perfil da profissional (nome/CRP) nem a
-- configuração de horários da agenda.
--
-- Todo nome/e-mail/telefone gerado aqui é claramente fictício
-- ("Paciente Teste 01", "@exemplo.com" etc.), para não ser confundido
-- com dado real, conforme decisão do projeto.
--
-- Como usar: Supabase → SQL Editor → New query → colar este arquivo
-- inteiro → Run. Se algo der errado no meio, nada é gravado (roda
-- dentro de uma transação).

begin;

truncate table
  public.audit_log,
  public.anexos,
  public.objetivos,
  public.evolucoes,
  public.prontuarios,
  public.lancamentos,
  public.tarefas,
  public.atendimentos,
  public.bloqueios,
  public.pacientes,
  public.convenios
cascade;

-- ----------------------------------------------------------
-- CONVÊNIOS
-- ----------------------------------------------------------
insert into public.convenios (id, nome, ativo, valor_sessao, prazo_repasse_dias, teto_mensal)
values
  (gen_random_uuid(), 'Unimed (teste)', true, 180.00, 30, 4),
  (gen_random_uuid(), 'Bradesco Saúde (teste)', true, 200.00, 45, 4),
  (gen_random_uuid(), 'SulAmérica (teste)', true, 190.00, 30, null);

-- ----------------------------------------------------------
-- PACIENTES (16, com sexo/faixa etária/convênio/status variados)
-- ----------------------------------------------------------
with numeros as (
  select n from generate_series(1, 16) as n
),
convs as (
  select id, row_number() over (order by nome) as rn from public.convenios
),
base as (
  select
    gen_random_uuid() as id,
    n,
    'Paciente Teste ' || lpad(n::text, 2, '0') as nome,
    (array['Feminino', 'Masculino', 'Outro'])[1 + (n % 3)] as sexo,
    (array['adulto', 'adulto', 'adolescente', 'crianca'])[1 + (n % 4)] as faixa_etaria,
    case when n % 3 = 0 then null else c.id end as convenio_id
  from numeros
  left join convs c on c.rn = 1 + (n % 3)
)
insert into public.pacientes (
  id, nome, telefone, email, nascimento, sexo, faixa_etaria, estado_civil,
  convenio_id, carteirinha, status, tipo_atendimento_padrao, consentimento_em, data_inicio_terapia,
  responsavel
)
select
  b.id,
  b.nome,
  '5511' || lpad((90000000 + b.n)::text, 9, '0'),
  'paciente.teste' || lpad(b.n::text, 2, '0') || '@exemplo.com',
  case b.faixa_etaria
    when 'crianca' then (current_date - ((5 + (b.n % 7)) || ' years')::interval)::date
    when 'adolescente' then (current_date - ((13 + (b.n % 5)) || ' years')::interval)::date
    else (current_date - ((24 + (b.n % 35)) || ' years')::interval)::date
  end,
  b.sexo,
  b.faixa_etaria,
  (array['Solteiro(a)', 'Casado(a)', 'Divorciado(a)'])[1 + (b.n % 3)],
  b.convenio_id,
  case when b.convenio_id is null then null else 'CART-' || lpad(b.n::text, 4, '0') end,
  (array['ativo', 'ativo', 'pendente', 'novo', 'inativo'])[1 + (b.n % 5)],
  case when b.n % 4 = 0 then 'online' else 'presencial' end,
  case when b.n % 2 = 0 then now() - (b.n || ' days')::interval else null end,
  (current_date - ((b.n * 17) || ' days')::interval)::date,
  case when b.faixa_etaria in ('crianca', 'adolescente') then 'Responsável Teste ' || lpad(b.n::text, 2, '0') else null end
from base b;

-- ----------------------------------------------------------
-- ATENDIMENTOS — grade de horários sem sobreposição (09h/10h30/14h/15h30,
-- dias úteis, de 30 dias atrás a 15 dias à frente), distribuídos entre os
-- 16 pacientes. Alguns do passado ficam de propósito sem confirmação
-- ("agendado"), para validar o aviso de pendência do Dashboard/Agenda.
-- ----------------------------------------------------------
with dias as (
  select d::date as dia
  from generate_series(current_date - interval '30 days', current_date + interval '15 days', interval '1 day') as d
  where extract(dow from d) not in (0, 6)
),
horarios as (
  select hora from (values ('09:00'::time), ('10:30'::time), ('14:00'::time), ('15:30'::time)) as h(hora)
),
slots as (
  select
    ((dias.dia + horarios.hora) at time zone 'America/Sao_Paulo') as inicio,
    row_number() over (order by dias.dia, horarios.hora) as slot_num
  from dias
  cross join horarios
),
pacientes_num as (
  select id, convenio_id, tipo_atendimento_padrao, row_number() over (order by nome) as rn
  from public.pacientes
)
insert into public.atendimentos (id, paciente_id, convenio_id, inicio, fim, tipo, status, valor)
select
  gen_random_uuid(),
  p.id,
  p.convenio_id,
  s.inicio,
  s.inicio + interval '50 minutes',
  p.tipo_atendimento_padrao,
  case
    when s.inicio > now() then (array['agendado', 'agendado', 'confirmado'])[1 + (s.slot_num % 3)]
    when s.slot_num % 11 = 0 then 'agendado' -- passado sem confirmação, de propósito
    else (array['realizado', 'realizado', 'realizado', 'falta', 'remarcar', 'cancelado'])[1 + (s.slot_num % 6)]
  end,
  case
    when p.convenio_id is not null then c.valor_sessao
    when s.slot_num % 5 = 0 then null
    else 150.00
  end
from slots s
join pacientes_num p on p.rn = 1 + ((s.slot_num - 1) % 16)
left join public.convenios c on c.id = p.convenio_id
where s.slot_num <= 70
order by s.slot_num;

-- ----------------------------------------------------------
-- LANÇAMENTOS — um por atendimento com valor preenchido (é assim que o
-- app faz ao salvar um atendimento com valor). ~60% dos atendimentos
-- passados "realizados" saem já pagos; o resto fica a receber/atrasado.
-- ----------------------------------------------------------
insert into public.lancamentos (id, atendimento_id, valor, vencimento, pago_em, forma)
select
  gen_random_uuid(),
  a.id,
  a.valor,
  (a.inicio::date + coalesce(c.prazo_repasse_dias, 0) * interval '1 day')::date,
  case
    when a.inicio < now() and a.status = 'realizado' and abs(hashtext(a.id::text)) % 5 < 3
      then a.inicio + interval '3 days'
    else null
  end,
  case
    when abs(hashtext(a.id::text)) % 5 < 3
      then (array['Pix', 'Cartão', 'Dinheiro'])[1 + (abs(hashtext(a.id::text)) % 3)]
    else null
  end
from public.atendimentos a
left join public.convenios c on c.id = a.convenio_id
where a.valor is not null;

-- ----------------------------------------------------------
-- BLOQUEIOS
-- ----------------------------------------------------------
insert into public.bloqueios (id, inicio, fim, motivo)
values
  (
    gen_random_uuid(),
    ((current_date - 3) + time '12:00') at time zone 'America/Sao_Paulo',
    ((current_date - 3) + time '13:00') at time zone 'America/Sao_Paulo',
    'Almoço estendido (teste)'
  ),
  (
    gen_random_uuid(),
    ((current_date + 5) + time '00:00') at time zone 'America/Sao_Paulo',
    ((current_date + 5) + time '23:59') at time zone 'America/Sao_Paulo',
    'Compromisso pessoal (teste)'
  ),
  (
    gen_random_uuid(),
    ((current_date + 20) + time '00:00') at time zone 'America/Sao_Paulo',
    ((current_date + 27) + time '23:59') at time zone 'America/Sao_Paulo',
    'Férias (teste)'
  );

-- ----------------------------------------------------------
-- TAREFAS
-- ----------------------------------------------------------
with p as (
  select id, row_number() over (order by nome) as rn from public.pacientes
)
insert into public.tarefas (id, titulo, paciente_id, vence_em, concluida_em)
select gen_random_uuid(), titulo, paciente_id, vence_em, concluida_em
from (
  values
    ('Ligar para confirmar retorno (teste)', (select id from p where rn = 1), current_date - 2, null::timestamptz),
    ('Enviar recibo pendente (teste)', (select id from p where rn = 2), current_date, null::timestamptz),
    ('Revisar plano terapêutico (teste)', (select id from p where rn = 3), current_date + 3, null::timestamptz),
    ('Atualizar prontuário (teste)', (select id from p where rn = 4), current_date + 10, null::timestamptz),
    ('Preparar material de sessão (teste)', null::uuid, null::date, null::timestamptz),
    ('Confirmar pagamento de convênio (teste)', (select id from p where rn = 5), current_date - 10, now())
) as t(titulo, paciente_id, vence_em, concluida_em);

-- ----------------------------------------------------------
-- PRONTUÁRIOS + OBJETIVOS + 1 EVOLUÇÃO (quando o paciente já tem
-- atendimento "realizado")
-- ----------------------------------------------------------
insert into public.prontuarios (id, paciente_id, motivo_consulta, tipo_profissional, nome_profissional)
select gen_random_uuid(), id, 'Acompanhamento psicológico (motivo sintético de teste)', 'psicologo', 'Raquel Frois'
from public.pacientes;

insert into public.objetivos (id, prontuario_id, titulo, concluido_em)
select gen_random_uuid(), pr.id, obj.titulo, obj.concluido
from public.prontuarios pr
cross join lateral (
  values
    ('Reduzir sintomas de ansiedade (teste)', null::timestamptz),
    ('Desenvolver estratégias de enfrentamento (teste)', now())
) as obj(titulo, concluido);

insert into public.evolucoes (id, prontuario_id, atendimento_id, modelo, conteudo, autor_id)
select
  gen_random_uuid(),
  pr.id,
  a.id,
  'livre',
  'Evolução sintética de teste referente à sessão de ' || to_char(a.inicio, 'DD/MM/YYYY') || '.',
  (select id from auth.users limit 1)
from public.prontuarios pr
join public.pacientes pac on pac.id = pr.paciente_id
join lateral (
  select id, inicio
  from public.atendimentos
  where paciente_id = pac.id and status = 'realizado'
  order by inicio desc
  limit 1
) a on true
where (select id from auth.users limit 1) is not null;

commit;
