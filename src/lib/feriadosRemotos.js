import { supabase } from "./supabaseClient.js";
import { definirFeriadosPersonalizados } from "./feriados.js";

/** Lista os feriados personalizados (municipal/estadual/recesso) do banco. */
export async function buscarFeriadosPersonalizados() {
  const { data, error } = await supabase
    .from("feriados")
    .select("id, data, nome, abrangencia, repete_todo_ano")
    .order("data", { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Carrega os feriados do banco e registra no cache de módulo, para o
 * `feriadoEm` passar a considerá-los. Chamado uma vez após o login.
 */
export async function sincronizarFeriados() {
  try {
    const lista = await buscarFeriadosPersonalizados();
    definirFeriadosPersonalizados(lista);
    return lista;
  } catch {
    // Sem rede ou sem permissão: segue só com os feriados nacionais.
    definirFeriadosPersonalizados([]);
    return [];
  }
}

export async function criarFeriado({ data, nome, abrangencia, repeteTodoAno }) {
  const { error } = await supabase.from("feriados").insert({
    data,
    nome: nome.trim(),
    abrangencia: abrangencia || "personalizado",
    repete_todo_ano: !!repeteTodoAno,
  });
  if (error) throw error;
}

export async function apagarFeriado(id) {
  const { error } = await supabase.from("feriados").delete().eq("id", id);
  if (error) throw error;
}
