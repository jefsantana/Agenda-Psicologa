import { supabase } from "./supabaseClient.js";

export async function buscarTodosConvenios() {
  const { data, error } = await supabase
    .from("convenios")
    .select("id, nome, ativo, valor_sessao, prazo_repasse_dias, teto_mensal")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data;
}

export async function salvarConvenio({ id, nome, ativo, valorSessao, prazoRepasseDias, tetoMensal }) {
  const payload = {
    nome: nome.trim(),
    ativo,
    valor_sessao: valorSessao === "" ? null : valorSessao,
    prazo_repasse_dias: prazoRepasseDias === "" ? null : prazoRepasseDias,
    teto_mensal: tetoMensal === "" ? null : tetoMensal,
  };

  const query = id
    ? supabase.from("convenios").update(payload).eq("id", id)
    : supabase.from("convenios").insert(payload);

  const { error } = await query;
  if (error) throw error;
}

/** Só apaga se não houver paciente ou atendimento vinculado a este convênio. */
export async function apagarConvenio(id) {
  const [{ count: pacientes, error: erroPacientes }, { count: atendimentos, error: erroAtendimentos }] =
    await Promise.all([
      supabase.from("pacientes").select("id", { count: "exact", head: true }).eq("convenio_id", id),
      supabase.from("atendimentos").select("id", { count: "exact", head: true }).eq("convenio_id", id),
    ]);
  if (erroPacientes) throw erroPacientes;
  if (erroAtendimentos) throw erroAtendimentos;

  if (pacientes > 0 || atendimentos > 0) {
    throw new Error(
      'Este convênio está vinculado a pacientes ou atendimentos — não pode ser excluído. Use a Situação "Inativo" para arquivá-lo.'
    );
  }

  const { error } = await supabase.from("convenios").delete().eq("id", id);
  if (error) throw error;
}
