/** Select e mapeamento de linhas de `atendimentos`/`bloqueios` compartilhados entre agenda, dashboard e a lista de atendimentos. */

export const SELECT_ATENDIMENTO =
  "id, inicio, fim, tipo, status, valor, convenio_id, paciente_id, paciente:pacientes(nome), convenio:convenios(nome)";

/** `convenioFallback` é o texto usado quando o atendimento não tem convênio vinculado. */
export function mapearAtendimento(linha, { convenioFallback = null } = {}) {
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
    convenio: linha.convenio?.nome ?? convenioFallback,
  };
}

export function mapearBloqueio(linha) {
  return { ...linha, inicio: new Date(linha.inicio), fim: new Date(linha.fim) };
}

/** Troca o erro de constraint de exclusão do Postgres (conflito de horário) por uma mensagem amigável. */
export function traduzirErroConflito(error) {
  if (error.code === "23P01") {
    return new Error("Já existe um atendimento marcado nesse horário.");
  }
  return error;
}
