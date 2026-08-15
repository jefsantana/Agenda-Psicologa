import { supabase } from "./supabaseClient.js";

/** Itens de checklist (sem horário) — o painel "Tarefas e lembretes". */
export async function buscarTarefas() {
  const { data, error } = await supabase
    .from("tarefas")
    .select("id, titulo, vence_em, concluida_em, paciente:pacientes(nome)")
    .is("concluida_em", null)
    .is("hora", null)
    .order("vence_em", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data;
}

/** Lembretes pessoais com horário (ex.: "15h — dentista") — "Agenda pessoal". */
export async function buscarCompromissosPessoais(limite = 5) {
  const hojeISO = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("tarefas")
    .select("id, titulo, vence_em, hora, concluida_em")
    .is("concluida_em", null)
    .not("hora", "is", null)
    .gte("vence_em", hojeISO)
    .order("vence_em", { ascending: true })
    .order("hora", { ascending: true })
    .limit(limite);

  if (error) throw error;
  return data;
}

export async function criarTarefa({ titulo, venceEm, pacienteId, hora }) {
  const { error } = await supabase.from("tarefas").insert({
    titulo: titulo.trim(),
    vence_em: venceEm || null,
    paciente_id: pacienteId || null,
    hora: hora || null,
  });
  if (error) throw error;
}

export async function atualizarTarefa(id, { titulo, venceEm, hora }) {
  const { error } = await supabase
    .from("tarefas")
    .update({ titulo: titulo.trim(), vence_em: venceEm || null, hora: hora || null })
    .eq("id", id);
  if (error) throw error;
}

export async function apagarTarefa(id) {
  const { error } = await supabase.from("tarefas").delete().eq("id", id);
  if (error) throw error;
}

/** Atualização otimista: quem chama já atualiza a lista local antes da resposta do servidor. */
export async function concluirTarefa(id) {
  const { error } = await supabase
    .from("tarefas")
    .update({ concluida_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
