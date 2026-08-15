import { supabase } from "./supabaseClient.js";

export async function buscarObjetivos(prontuarioId) {
  const { data, error } = await supabase
    .from("objetivos")
    .select("id, titulo, concluido_em")
    .eq("prontuario_id", prontuarioId)
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

export async function criarObjetivo(prontuarioId, titulo) {
  const { error } = await supabase.from("objetivos").insert({ prontuario_id: prontuarioId, titulo });
  if (error) throw error;
}

export async function alternarObjetivo(id, concluido) {
  const { error } = await supabase
    .from("objetivos")
    .update({ concluido_em: concluido ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function removerObjetivo(id) {
  const { error } = await supabase.from("objetivos").delete().eq("id", id);
  if (error) throw error;
}
