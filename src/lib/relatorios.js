import { buscarAtendimentosEntre } from "./dashboard.js";
import { buscarLancamentos } from "./financeiro.js";
import { inicioDoMes, fimDoMes } from "./date.js";

/** Fechamento de um mês: sessões por status, faturado (por sessão realizada), recebido (por pagamento) e por convênio. */
export async function buscarFechamentoMensal(mesBase) {
  const mesISO = `${mesBase.getFullYear()}-${String(mesBase.getMonth() + 1).padStart(2, "0")}`;

  const [atendimentosDoMes, lancamentos] = await Promise.all([
    buscarAtendimentosEntre(inicioDoMes(mesBase), fimDoMes(mesBase)),
    buscarLancamentos(),
  ]);

  const sessoes = { realizadas: 0, faltas: 0, remarcadas: 0, canceladas: 0 };
  const porConvenio = new Map();

  for (const atendimento of atendimentosDoMes) {
    if (atendimento.status === "falta") sessoes.faltas += 1;
    else if (atendimento.status === "remarcar") sessoes.remarcadas += 1;
    else if (atendimento.status === "cancelado") sessoes.canceladas += 1;

    if (atendimento.status === "realizado") {
      sessoes.realizadas += 1;
      const nome = atendimento.convenio ?? "Particular";
      const linha = porConvenio.get(nome) ?? { nome, sessoes: 0, faturado: 0 };
      linha.sessoes += 1;
      linha.faturado += Number(atendimento.valor ?? 0);
      porConvenio.set(nome, linha);
    }
  }

  const faturado = [...porConvenio.values()].reduce((soma, linha) => soma + linha.faturado, 0);

  const lancamentosPagosNoMes = lancamentos.filter((l) => l.pagoEm?.slice(0, 7) === mesISO);
  const recebido = lancamentosPagosNoMes.reduce((soma, l) => soma + l.valor, 0);

  const lancamentosDoMes = lancamentos.filter((l) => l.vencimento.slice(0, 7) === mesISO);
  const aReceber = lancamentosDoMes.filter((l) => !l.pagoEm).reduce((soma, l) => soma + l.valor, 0);

  return {
    sessoes,
    faturado,
    recebido,
    aReceber,
    porConvenio: [...porConvenio.values()].sort((a, b) => b.faturado - a.faturado),
  };
}
