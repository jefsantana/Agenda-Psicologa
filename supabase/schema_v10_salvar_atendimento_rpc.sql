-- Migração v10 — salvar atendimento + lançamento financeiro numa transação
--
-- Como usar: cole no SQL Editor do Supabase e clique em Run. Roda depois do
-- schema_v9_auditoria_append_only.sql.
--
-- Antes, o código (src/lib/agenda.js) gravava o atendimento e DEPOIS fazia 2 a 4
-- chamadas separadas para acertar o lançamento financeiro. Se uma dessas falhava,
-- ficava um atendimento com valor mas sem lançamento (ou vice-versa) e nenhum
-- erro aparecia. Esta função faz tudo de uma vez: ou grava os dois, ou nenhum.

create or replace function public.salvar_atendimento(
  p_id           uuid,
  p_paciente_id  uuid,
  p_inicio       timestamptz,
  p_fim          timestamptz,
  p_tipo         text,
  p_convenio_id  uuid,
  p_valor        numeric,
  p_status       text
)
returns uuid
language plpgsql
security invoker           -- respeita a RLS (eh_psicologa()) da conta que chamou
set search_path = public
as $$
declare
  v_id            uuid;
  v_prazo         int := 0;
  v_vencimento    date;
  v_lancamento_id uuid;
begin
  if p_id is null then
    insert into atendimentos (paciente_id, inicio, fim, tipo, convenio_id, valor, status)
    values (p_paciente_id, p_inicio, p_fim, p_tipo, p_convenio_id, p_valor, p_status)
    returning id into v_id;
  else
    update atendimentos
       set paciente_id = p_paciente_id,
           inicio      = p_inicio,
           fim         = p_fim,
           tipo        = p_tipo,
           convenio_id = p_convenio_id,
           valor       = p_valor,
           status      = p_status
     where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Atendimento % não encontrado', p_id;
    end if;
  end if;

  -- Sem valor: remove qualquer lançamento anterior deste atendimento.
  if p_valor is null then
    delete from lancamentos where atendimento_id = v_id;
    return v_id;
  end if;

  if p_convenio_id is not null then
    select coalesce(prazo_repasse_dias, 0) into v_prazo
      from convenios where id = p_convenio_id;
  end if;
  -- Data no fuso local (a psicóloga marca em horário de Brasília); evita que
  -- um atendimento à noite "pule" para o dia seguinte no vencimento.
  v_vencimento := (p_inicio at time zone 'America/Sao_Paulo')::date + coalesce(v_prazo, 0);

  select id into v_lancamento_id from lancamentos where atendimento_id = v_id;

  if v_lancamento_id is null then
    insert into lancamentos (atendimento_id, valor, vencimento)
    values (v_id, p_valor, v_vencimento);
  else
    -- Mantém pago_em / forma; só atualiza valor e vencimento.
    update lancamentos
       set valor = p_valor, vencimento = v_vencimento
     where id = v_lancamento_id;
  end if;

  return v_id;
end;
$$;
