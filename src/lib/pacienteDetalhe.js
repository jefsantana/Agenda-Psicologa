import { supabase } from "./supabaseClient.js";

/** Sessões, faltas e valor em aberto do paciente — os 3 chips da ficha. */
export async function buscarResumoPaciente(pacienteId) {
  const [{ count: sessoes, error: erroSessoes }, { count: faltas, error: erroFaltas }, { data: lancamentos, error: erroLancamentos }] =
    await Promise.all([
      supabase
        .from("atendimentos")
        .select("id", { count: "exact", head: true })
        .eq("paciente_id", pacienteId)
        .neq("status", "cancelado"),
      supabase
        .from("atendimentos")
        .select("id", { count: "exact", head: true })
        .eq("paciente_id", pacienteId)
        .eq("status", "falta"),
      supabase
        .from("lancamentos")
        .select("valor, atendimento:atendimentos!inner(paciente_id)")
        .is("pago_em", null)
        .eq("atendimento.paciente_id", pacienteId),
    ]);

  if (erroSessoes) throw erroSessoes;
  if (erroFaltas) throw erroFaltas;
  if (erroLancamentos) throw erroLancamentos;

  const emAberto = lancamentos.reduce((soma, l) => soma + Number(l.valor), 0);
  return { sessoes: sessoes ?? 0, faltas: faltas ?? 0, emAberto };
}

/** Últimos atendimentos do paciente, cada um com a evolução mais recente (se houver) e o GAD-7 (se houver). */
export async function buscarSessoesRecentes(pacienteId, limite = 5) {
  const { data: atendimentos, error: erroAtendimentos } = await supabase
    .from("atendimentos")
    .select("id, inicio, status")
    .eq("paciente_id", pacienteId)
    .order("inicio", { ascending: false })
    .limit(limite);
  if (erroAtendimentos) throw erroAtendimentos;
  if (atendimentos.length === 0) return [];

  const ids = atendimentos.map((a) => a.id);

  const [{ data: evolucoes, error: erroEvolucoes }, { data: avaliacoes, error: erroAvaliacoes }] = await Promise.all([
    supabase.from("evolucoes").select("atendimento_id, conteudo, criado_em").in("atendimento_id", ids).order("criado_em", { ascending: false }),
    supabase.from("avaliacoes_gad7").select("atendimento_id, pontuacao").in("atendimento_id", ids),
  ]);
  if (erroEvolucoes) throw erroEvolucoes;
  if (erroAvaliacoes) throw erroAvaliacoes;

  const ultimaEvolucaoPorAtendimento = new Map();
  for (const evolucao of evolucoes) {
    if (!ultimaEvolucaoPorAtendimento.has(evolucao.atendimento_id)) {
      ultimaEvolucaoPorAtendimento.set(evolucao.atendimento_id, evolucao.conteudo);
    }
  }
  const gad7PorAtendimento = new Map(avaliacoes.map((a) => [a.atendimento_id, a.pontuacao]));

  return atendimentos.map((a) => ({
    id: a.id,
    inicio: new Date(a.inicio),
    status: a.status,
    resumoEvolucao: resumir(ultimaEvolucaoPorAtendimento.get(a.id)),
    gad7: gad7PorAtendimento.get(a.id) ?? null,
  }));
}

function resumir(texto) {
  if (!texto) return null;
  const limpo = texto.trim();
  return limpo.length > 70 ? `${limpo.slice(0, 70)}…` : limpo;
}
