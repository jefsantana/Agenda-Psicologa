import { supabase } from "./supabaseClient.js";

const SELECT_ATENDIMENTO_SESSAO =
  "id, inicio, fim, tipo, status, convenio_id, paciente_id, paciente:pacientes(id, nome), convenio:convenios(nome)";

export async function buscarAtendimentoParaSessao(atendimentoId) {
  const { data, error } = await supabase
    .from("atendimentos")
    .select(SELECT_ATENDIMENTO_SESSAO)
    .eq("id", atendimentoId)
    .single();
  if (error) throw error;
  return {
    ...data,
    inicio: new Date(data.inicio),
    fim: new Date(data.fim),
    paciente: data.paciente?.nome ?? "Paciente removido",
    convenio: data.convenio?.nome ?? "Particular",
  };
}

/** Quantos atendimentos anteriores (não cancelados) o paciente já teve — para "nª sessão". */
export async function contarSessoesAnteriores(pacienteId, antesDe) {
  const { count, error } = await supabase
    .from("atendimentos")
    .select("id", { count: "exact", head: true })
    .eq("paciente_id", pacienteId)
    .neq("status", "cancelado")
    .lte("inicio", antesDe.toISOString());
  if (error) throw error;
  return count ?? 1;
}

/** Última versão salva da evolução deste atendimento (rascunho em andamento), se houver. */
export async function buscarUltimaEvolucao(atendimentoId) {
  const { data, error } = await supabase
    .from("evolucoes")
    .select("id, conteudo, versao, criado_em")
    .eq("atendimento_id", atendimentoId)
    .order("versao", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Evolução é versionada e nunca apagada (ver schema_v2_fase1.sql) — cada
 * autosave insere uma versão nova em vez de sobrescrever a anterior.
 */
export async function salvarNovaVersaoEvolucao({ prontuarioId, atendimentoId, conteudo, versaoAnterior }) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase
    .from("evolucoes")
    .insert({
      prontuario_id: prontuarioId,
      atendimento_id: atendimentoId,
      conteudo,
      modelo: "livre",
      versao: (versaoAnterior ?? 0) + 1,
      autor_id: session?.user?.id,
    })
    .select("id, versao, criado_em")
    .single();
  if (error) throw error;
  return data;
}

const GAD7_MAX = 21;

export function severidadeGad7(pontuacao) {
  if (pontuacao <= 4) return { rotulo: "Mínima", tom: "minima" };
  if (pontuacao <= 9) return { rotulo: "Leve", tom: "leve" };
  if (pontuacao <= 14) return { rotulo: "Moderada", tom: "moderada" };
  return { rotulo: "Severa", tom: "severa" };
}

export async function buscarGad7DoPaciente(pacienteId, limite = 6) {
  const { data, error } = await supabase
    .from("avaliacoes_gad7")
    .select("id, pontuacao, criado_em")
    .eq("paciente_id", pacienteId)
    .order("criado_em", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data.reverse(); // ordem cronológica, mais antiga primeiro
}

export async function salvarGad7({ atendimentoId, pacienteId, respostas }) {
  if (respostas.length !== 7 || respostas.some((n) => n < 0 || n > 3)) {
    throw new Error("Escala GAD-7 precisa de 7 respostas, cada uma de 0 a 3.");
  }
  const { data, error } = await supabase
    .from("avaliacoes_gad7")
    .insert({ atendimento_id: atendimentoId, paciente_id: pacienteId, respostas })
    .select("id, pontuacao, criado_em")
    .single();
  if (error) throw error;
  return data;
}

export { GAD7_MAX };
