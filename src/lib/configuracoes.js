import { supabase } from "./supabaseClient.js";

export async function buscarHorariosSemana() {
  const { data, error } = await supabase
    .from("configuracoes_agenda")
    .select("id, dia_semana, ativo, hora_inicio, hora_fim, duracao_padrao_minutos")
    .order("dia_semana", { ascending: true });
  if (error) throw error;
  return data;
}

export async function salvarHorarioDia(id, dados) {
  const { error } = await supabase.from("configuracoes_agenda").update(dados).eq("id", id);
  if (error) throw error;
}
