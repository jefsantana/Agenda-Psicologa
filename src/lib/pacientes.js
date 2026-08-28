import { supabase } from "./supabaseClient.js";

const SELECT_PACIENTE =
  "id, nome, email, telefone, nascimento, cpf, carteirinha, responsavel, consentimento_em, status, ativo, convenio_id, " +
  "sexo, estado_civil, filiacao, escolaridade, profissao, rg, endereco, data_inicio_terapia, " +
  "tipo_atendimento_padrao, faixa_etaria, " +
  "convenio:convenios(id, nome)";

/** Escapa os curingas do LIKE para que %, _ e \ digitados sejam buscados literalmente. */
function escaparLike(texto) {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function buscarPacientes(busca = "") {
  let query = supabase.from("pacientes").select(SELECT_PACIENTE).order("nome", { ascending: true });

  if (busca.trim()) {
    query = query.ilike("nome", `%${escaparLike(busca.trim())}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** Data do próximo atendimento futuro de cada paciente (para a lista). */
export async function buscarProximosAtendimentosPorPaciente() {
  const { data, error } = await supabase
    .from("atendimentos")
    .select("paciente_id, inicio")
    .gt("inicio", new Date().toISOString())
    .not("status", "in", "(cancelado,falta)")
    .order("inicio", { ascending: true });

  if (error) throw error;

  const proximaPorPaciente = new Map();
  for (const linha of data) {
    if (!proximaPorPaciente.has(linha.paciente_id)) {
      proximaPorPaciente.set(linha.paciente_id, new Date(linha.inicio));
    }
  }
  return proximaPorPaciente;
}

export async function buscarConvenios() {
  const { data, error } = await supabase
    .from("convenios")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome", { ascending: true });
  if (error) throw error;
  return data;
}

export async function criarPaciente(dados) {
  const { data, error } = await supabase
    .from("pacientes")
    .insert(limparCamposVazios(dados))
    .select("id, nome, tipo_atendimento_padrao, faixa_etaria")
    .single();
  if (error) throw error;
  return data;
}

export async function atualizarPaciente(id, dados) {
  const { error } = await supabase.from("pacientes").update(limparCamposVazios(dados)).eq("id", id);
  if (error) throw error;
}

/**
 * Só apaga de verdade se não houver nada vinculado (atendimento ou prontuário).
 * Havendo histórico, orienta a usar Status "Inativo" em vez de perder o registro.
 */
export async function apagarPaciente(id) {
  const [{ count: atendimentos, error: erroAtendimentos }, { count: prontuarios, error: erroProntuarios }] =
    await Promise.all([
      supabase.from("atendimentos").select("id", { count: "exact", head: true }).eq("paciente_id", id),
      supabase.from("prontuarios").select("id", { count: "exact", head: true }).eq("paciente_id", id),
    ]);
  if (erroAtendimentos) throw erroAtendimentos;
  if (erroProntuarios) throw erroProntuarios;

  if (atendimentos > 0 || prontuarios > 0) {
    throw new Error(
      "Este paciente tem atendimentos ou prontuário registrados — não pode ser excluído. Use o Status \"Inativo\" para arquivá-lo."
    );
  }

  const { error } = await supabase.from("pacientes").delete().eq("id", id);
  if (error) throw error;
}

function limparCamposVazios(dados) {
  const limpo = {};
  for (const [chave, valor] of Object.entries(dados)) {
    limpo[chave] = valor === "" ? null : valor;
  }
  return limpo;
}
