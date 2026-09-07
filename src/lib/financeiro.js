import { supabase } from "./supabaseClient.js";
import { paraISO } from "./date.js";

const SELECT =
  "id, valor, vencimento, pago_em, forma, atendimento:atendimentos(inicio, paciente:pacientes(nome, telefone), convenio:convenios(nome))";

export function statusLancamento(lancamento) {
  if (lancamento.pagoEm) return "pago";
  if (lancamento.vencimento < paraISO(new Date())) return "atrasado";
  return "pendente";
}

export async function buscarLancamentos() {
  const { data, error } = await supabase.from("lancamentos").select(SELECT).order("vencimento", { ascending: false });
  if (error) throw error;

  return data.map((linha) => ({
    id: linha.id,
    valor: Number(linha.valor),
    vencimento: linha.vencimento,
    pagoEm: linha.pago_em,
    forma: linha.forma,
    paciente: linha.atendimento?.paciente?.nome ?? "Paciente removido",
    telefone: linha.atendimento?.paciente?.telefone ?? null,
    convenio: linha.atendimento?.convenio?.nome ?? "Particular",
    dataAtendimento: linha.atendimento?.inicio ? new Date(linha.atendimento.inicio) : null,
  }));
}

export async function baixarPagamento(id, forma) {
  const { error } = await supabase
    .from("lancamentos")
    .update({ pago_em: new Date().toISOString(), forma: forma || null })
    .eq("id", id);
  if (error) throw error;
}

export async function estornarPagamento(id) {
  const { error } = await supabase.from("lancamentos").update({ pago_em: null, forma: null }).eq("id", id);
  if (error) throw error;
}
