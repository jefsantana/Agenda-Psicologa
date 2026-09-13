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

/** `busca` casa por nome sempre; se parecer CPF (3+ dígitos), casa por CPF também. */
export async function buscarPacientes(busca = "") {
  let query = supabase.from("pacientes").select(SELECT_PACIENTE).order("nome", { ascending: true });

  const termo = busca.trim();
  if (termo) {
    const somenteDigitos = termo.replace(/\D/g, "");
    if (somenteDigitos.length >= 3) {
      query = query.or(`nome.ilike.%${escaparLike(termo)}%,cpf.ilike.%${somenteDigitos}%`);
    } else {
      query = query.ilike("nome", `%${escaparLike(termo)}%`);
    }
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

// Campos do prontuário que representam conteúdo clínico de verdade. A tela
// de prontuário cria essa linha automaticamente assim que é aberta (ver
// lib/prontuario.js), mesmo sem a profissional preencher nada — então só a
// linha EXISTIR não significa que há dado clínico real; olhamos o conteúdo.
const CAMPOS_CONTEUDO_PRONTUARIO = [
  "motivo_consulta",
  "encaminhado_por",
  "avaliacao_objetivo",
  "data_termino_terapia",
  "motivo_termino",
  "tipo_profissional",
  "nome_profissional",
  "numero_conselho",
];

/**
 * Só apaga de verdade se não houver nada vinculado de verdade (atendimento,
 * lançamento Unimed, avaliação GAD-7, ou prontuário com conteúdo/evolução/
 * objetivo registrado). Um prontuário vazio — criado só por ter aberto a
 * aba, sem nada preenchido — não bloqueia mais a exclusão, senão nenhum
 * cadastro feito por engano (e depois "aberto" por engano) poderia ser
 * corrigido sem virar lixo permanente no sistema.
 * Havendo histórico de verdade, orienta a usar Status "Inativo" em vez de
 * perder o registro.
 */
export async function apagarPaciente(id) {
  const [
    { count: atendimentos, error: erroAtendimentos },
    { count: unimed, error: erroUnimed },
    { count: gad7, error: erroGad7 },
    { data: prontuario, error: erroProntuario },
  ] = await Promise.all([
    supabase.from("atendimentos").select("id", { count: "exact", head: true }).eq("paciente_id", id),
    supabase.from("unimed_lancamentos").select("id", { count: "exact", head: true }).eq("paciente_id", id),
    supabase.from("avaliacoes_gad7").select("id", { count: "exact", head: true }).eq("paciente_id", id),
    supabase.from("prontuarios").select(["id", ...CAMPOS_CONTEUDO_PRONTUARIO].join(", ")).eq("paciente_id", id).maybeSingle(),
  ]);
  if (erroAtendimentos) throw erroAtendimentos;
  if (erroUnimed) throw erroUnimed;
  if (erroGad7) throw erroGad7;
  if (erroProntuario) throw erroProntuario;

  if (atendimentos > 0 || unimed > 0 || gad7 > 0) {
    throw new Error(
      "Este paciente tem atendimentos, lançamentos ou avaliações registrados — não pode ser excluído. Use o Status \"Inativo\" para arquivá-lo."
    );
  }

  if (prontuario) {
    const temConteudo = CAMPOS_CONTEUDO_PRONTUARIO.some((campo) => prontuario[campo]);
    const [{ count: evolucoes, error: erroEvolucoes }, { count: objetivos, error: erroObjetivos }] = await Promise.all([
      supabase.from("evolucoes").select("id", { count: "exact", head: true }).eq("prontuario_id", prontuario.id),
      supabase.from("objetivos").select("id", { count: "exact", head: true }).eq("prontuario_id", prontuario.id),
    ]);
    if (erroEvolucoes) throw erroEvolucoes;
    if (erroObjetivos) throw erroObjetivos;

    if (temConteudo || evolucoes > 0 || objetivos > 0) {
      throw new Error(
        "Este paciente tem prontuário com conteúdo registrado — não pode ser excluído. Use o Status \"Inativo\" para arquivá-lo."
      );
    }
  }

  // O prontuário vazio (se houver) é apagado automaticamente junto — a
  // coluna prontuarios.paciente_id tem ON DELETE CASCADE.
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
