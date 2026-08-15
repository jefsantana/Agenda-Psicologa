import { supabase } from "./supabaseClient.js";
import { minutosEntreHoras, paraISO } from "./date.js";

const SELECT_ATENDIMENTO =
  "id, inicio, fim, tipo, status, valor, convenio_id, paciente_id, paciente:pacientes(nome), convenio:convenios(nome)";

function mapearAtendimento(linha) {
  return {
    id: linha.id,
    inicio: new Date(linha.inicio),
    fim: new Date(linha.fim),
    tipo: linha.tipo,
    status: linha.status,
    valor: linha.valor,
    pacienteId: linha.paciente_id,
    convenioId: linha.convenio_id,
    paciente: linha.paciente?.nome ?? "Paciente removido",
    convenio: linha.convenio?.nome ?? null,
  };
}

export async function buscarConfiguracoesAgenda() {
  const { data, error } = await supabase.from("configuracoes_agenda").select("*");
  if (error) throw error;

  const porDia = new Map();
  for (const config of data) porDia.set(config.dia_semana, config);
  return porDia;
}

/** Atendimentos entre dois instantes, com nome do paciente e convênio. */
export async function buscarAtendimentosPorPeriodo(inicioDate, fimDate) {
  const { data, error } = await supabase
    .from("atendimentos")
    .select(SELECT_ATENDIMENTO)
    .gte("inicio", inicioDate.toISOString())
    .lte("inicio", fimDate.toISOString())
    .order("inicio", { ascending: true });

  if (error) throw error;
  return data.map(mapearAtendimento);
}

export async function buscarBloqueiosPorPeriodo(inicioDate, fimDate) {
  const { data, error } = await supabase
    .from("bloqueios")
    .select("id, inicio, fim, motivo")
    .lt("inicio", fimDate.toISOString())
    .gt("fim", inicioDate.toISOString())
    .order("inicio", { ascending: true });

  if (error) throw error;
  return data.map((linha) => ({ ...linha, inicio: new Date(linha.inicio), fim: new Date(linha.fim) }));
}

/** Quantos atendimentos existem por dia (yyyy-mm-dd) num período — para pontinhos no calendário do mês. */
export async function contarAtendimentosPorDia(inicioDate, fimDate) {
  const { data, error } = await supabase
    .from("atendimentos")
    .select("inicio")
    .gte("inicio", inicioDate.toISOString())
    .lte("inicio", fimDate.toISOString())
    .not("status", "eq", "cancelado");

  if (error) throw error;

  const contagem = new Set();
  for (const linha of data) contagem.add(paraISO(new Date(linha.inicio)));
  return contagem;
}

/** Quantas vagas de agenda existem num dia da semana, segundo a configuração salva. */
export function slotsDisponiveis(configDia) {
  if (!configDia || !configDia.ativo) return 0;
  const minutos = minutosEntreHoras(configDia.hora_inicio, configDia.hora_fim);
  return Math.max(1, Math.floor(minutos / configDia.duracao_padrao_minutos));
}

const STATUS_RESOLVIDOS = ["realizado", "falta", "remarcar", "cancelado"];

/**
 * Atendimentos de antes de uma data que ainda não foram confirmados
 * (Atendido/Faltou/Reagendou/Cancelou) — usado para avisar, nos dias
 * seguintes, que ficou pendência para trás.
 */
export async function contarPendenciasAnteriores(antesDe) {
  const { data, error } = await supabase
    .from("atendimentos")
    .select("id, inicio")
    .lt("inicio", antesDe.toISOString())
    .not("status", "in", `(${STATUS_RESOLVIDOS.join(",")})`)
    .order("inicio", { ascending: true });
  if (error) throw error;

  return { total: data.length, maisAntigo: data[0] ? new Date(data[0].inicio) : null };
}

/**
 * Existe algum atendimento (não cancelado/falta) que cobre esse instante?
 * Usado para avisar antes de marcar um compromisso pessoal em cima de um
 * paciente já agendado.
 */
export async function buscarAtendimentoNoInstante(instante) {
  const { data, error } = await supabase
    .from("atendimentos")
    .select("id, inicio, paciente:pacientes(nome)")
    .lte("inicio", instante.toISOString())
    .gt("fim", instante.toISOString())
    .not("status", "in", "(cancelado,falta)")
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, inicio: new Date(data.inicio), paciente: data.paciente?.nome ?? "Paciente removido" } : null;
}

/** Outros atendimentos (passados e futuros, não cancelados) de um paciente — usado para evitar reagendar em cima do que já existe. */
export async function buscarAtendimentosDoPaciente(pacienteId) {
  const { data, error } = await supabase
    .from("atendimentos")
    .select("id, inicio, status")
    .eq("paciente_id", pacienteId)
    .not("status", "eq", "cancelado")
    .order("inicio", { ascending: true });
  if (error) throw error;
  return data.map((linha) => ({ ...linha, inicio: new Date(linha.inicio) }));
}

function traduzirErroConflito(error) {
  if (error.code === "23P01") {
    return new Error("Já existe um atendimento marcado nesse horário.");
  }
  return error;
}

/** Lançamento rápido (dashboard): cria o atendimento para um paciente já selecionado no cadastro. */
export async function criarAtendimentoRapido({ pacienteId, inicio, fim, tipo }) {
  const { error } = await supabase.from("atendimentos").insert({
    paciente_id: pacienteId,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    tipo,
  });

  if (error) throw traduzirErroConflito(error);
}

/** Criação/edição completa (tela de Agenda): paciente já selecionado no cadastro, convênio, valor, status. */
export async function salvarAtendimento({ id, pacienteId, inicio, fim, tipo, convenioId, valor, status }) {
  const valorFinal = valor === "" ? null : valor;

  const payload = {
    paciente_id: pacienteId,
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    tipo,
    convenio_id: convenioId || null,
    valor: valorFinal,
    status,
  };

  const query = id
    ? supabase.from("atendimentos").update(payload).eq("id", id).select("id").single()
    : supabase.from("atendimentos").insert(payload).select("id").single();

  const { data: salvo, error } = await query;
  if (error) throw traduzirErroConflito(error);

  await sincronizarLancamento(salvo.id, valorFinal, inicio, convenioId);
}

/**
 * Todo atendimento com valor ganha (ou atualiza) um lançamento financeiro
 * automaticamente — a psicóloga não precisa lançar tudo duas vezes.
 * Sem valor, qualquer lançamento antigo daquele atendimento é removido.
 */
async function sincronizarLancamento(atendimentoId, valor, inicio, convenioId) {
  if (!valor) {
    await supabase.from("lancamentos").delete().eq("atendimento_id", atendimentoId);
    return;
  }

  let prazoRepasseDias = 0;
  if (convenioId) {
    const { data: convenio } = await supabase
      .from("convenios")
      .select("prazo_repasse_dias")
      .eq("id", convenioId)
      .maybeSingle();
    prazoRepasseDias = convenio?.prazo_repasse_dias ?? 0;
  }

  const vencimento = new Date(inicio);
  vencimento.setDate(vencimento.getDate() + prazoRepasseDias);

  const { data: existente } = await supabase
    .from("lancamentos")
    .select("id, pago_em")
    .eq("atendimento_id", atendimentoId)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("lancamentos")
      .update({ valor, vencimento: paraISO(vencimento) })
      .eq("id", existente.id);
  } else {
    await supabase.from("lancamentos").insert({
      atendimento_id: atendimentoId,
      valor,
      vencimento: paraISO(vencimento),
    });
  }
}

/**
 * Apaga o atendimento e, se houver, o lançamento financeiro associado.
 * Bloqueia a exclusão se o lançamento já estiver marcado como pago — é preciso
 * estornar o pagamento no Financeiro primeiro para não perder o histórico de recebimento.
 */
export async function apagarAtendimento(id) {
  const { data: lancamento, error: erroBusca } = await supabase
    .from("lancamentos")
    .select("id, pago_em")
    .eq("atendimento_id", id)
    .maybeSingle();
  if (erroBusca) throw erroBusca;

  if (lancamento?.pago_em) {
    throw new Error("Este atendimento tem um pagamento registrado no Financeiro. Estorne o pagamento antes de excluir.");
  }

  if (lancamento) {
    await supabase.from("lancamentos").delete().eq("id", lancamento.id);
  }

  const { error } = await supabase.from("atendimentos").delete().eq("id", id);
  if (error) throw error;
}

/** Confirmação rápida do que aconteceu no atendimento (usado na Agenda do dia). */
export async function atualizarStatusAtendimento(id, status) {
  const { error } = await supabase.from("atendimentos").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function criarBloqueio({ inicio, fim, motivo }) {
  const { error } = await supabase.from("bloqueios").insert({
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
    motivo: motivo || null,
  });
  if (error) throw traduzirErroConflito(error);
}

export async function atualizarBloqueio(id, { inicio, fim, motivo }) {
  const { error } = await supabase
    .from("bloqueios")
    .update({ inicio: inicio.toISOString(), fim: fim.toISOString(), motivo: motivo || null })
    .eq("id", id);
  if (error) throw traduzirErroConflito(error);
}

export async function apagarBloqueio(id) {
  const { error } = await supabase.from("bloqueios").delete().eq("id", id);
  if (error) throw error;
}
