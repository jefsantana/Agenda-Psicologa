import { supabase } from "./supabaseClient.js";

const SELECT_ATENDIMENTO =
  "id, inicio, fim, tipo, status, valor, paciente_id, convenio_id, paciente:pacientes(nome), convenio:convenios(nome)";

function mapearAtendimento(linha) {
  return {
    id: linha.id,
    inicio: new Date(linha.inicio),
    fim: new Date(linha.fim),
    tipo: linha.tipo,
    status: linha.status,
    valor: linha.valor,
    pacienteId: linha.paciente_id,
    convenioId: linha.convenio_id,
    paciente: linha.paciente?.nome ?? "Paciente removido",
    convenio: linha.convenio?.nome ?? "Particular",
  };
}

export async function buscarAtendimentosEntre(inicioDate, fimDate) {
  const { data, error } = await supabase
    .from("atendimentos")
    .select(SELECT_ATENDIMENTO)
    .gte("inicio", inicioDate.toISOString())
    .lt("inicio", fimDate.toISOString())
    .order("inicio", { ascending: true });

  if (error) throw error;
  return data.map(mapearAtendimento);
}

export async function buscarBloqueiosEntre(inicioDate, fimDate) {
  const { data, error } = await supabase
    .from("bloqueios")
    .select("id, inicio, fim, motivo")
    .lt("inicio", fimDate.toISOString())
    .gt("fim", inicioDate.toISOString())
    .order("inicio", { ascending: true });

  if (error) throw error;
  return data.map((linha) => ({ ...linha, inicio: new Date(linha.inicio), fim: new Date(linha.fim) }));
}

/** Atendimentos de um período, já com o telefone do paciente — usado no atalho de WhatsApp. */
export async function buscarAtendimentosParaWhatsapp(inicioDate, fimDate) {
  const { data, error } = await supabase
    .from("atendimentos")
    .select("id, inicio, status, paciente:pacientes(id, nome, telefone)")
    .gte("inicio", inicioDate.toISOString())
    .lt("inicio", fimDate.toISOString())
    .not("status", "in", "(cancelado,falta)")
    .order("inicio", { ascending: true });

  if (error) throw error;

  return data
    .filter((linha) => linha.paciente?.telefone)
    .map((linha) => ({
      atendimentoId: linha.id,
      inicio: new Date(linha.inicio),
      paciente: linha.paciente,
    }));
}
