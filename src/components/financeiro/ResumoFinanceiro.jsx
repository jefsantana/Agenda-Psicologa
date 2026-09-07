import { linkWhatsapp } from "../../lib/whatsapp.js";
import { formatarMoeda, formatarMoedaResumo } from "../../lib/date.js";
import "../dashboard/DashboardChips.css";
import "./ResumoFinanceiro.css";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** `lancamentos` já vem carregado da FinanceiroPage — este componente só resume por mês. */
export default function ResumoFinanceiro({ lancamentos, mes, onMudarMes }) {
  const mesISO = paraISOMes(mes);
  const mesAnteriorISO = paraISOMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1));

  const doMes = lancamentos.filter((l) => l.vencimento.slice(0, 7) === mesISO);
  const pagosDoMes = doMes.filter((l) => l.pagoEm);
  const recebidoMes = pagosDoMes.reduce((soma, l) => soma + l.valor, 0);
  const aReceberDoMes = doMes.filter((l) => !l.pagoEm).reduce((soma, l) => soma + l.valor, 0);
  const recebidoMesAnterior = lancamentos
    .filter((l) => l.pagoEm?.slice(0, 7) === mesAnteriorISO)
    .reduce((soma, l) => soma + l.valor, 0);
  const deltaPct =
    recebidoMesAnterior > 0 ? Math.round(((recebidoMes - recebidoMesAnterior) / recebidoMesAnterior) * 100) : null;
  const pctRecebido = recebidoMes + aReceberDoMes > 0 ? Math.round((recebidoMes / (recebidoMes + aReceberDoMes)) * 100) : 0;
  const ticketMedio = pagosDoMes.length > 0 ? recebidoMes / pagosDoMes.length : 0;

  const hojeISO = paraISODia(new Date());
  const vencidos = lancamentos.filter((l) => !l.pagoEm && l.vencimento < hojeISO);
  const pacientesVencidos = new Set(vencidos.map((l) => l.paciente)).size;
  const totalVencido = vencidos.reduce((soma, l) => soma + l.valor, 0);

  const aReceberOrdenado = lancamentos
    .filter((l) => !l.pagoEm)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  return (
    <div className="resumo-fin">
      <div className="resumo-fin__mes-nav">
        <button type="button" onClick={() => onMudarMes(-1)} aria-label="Mês anterior">
          ←
        </button>
        <span>
          {MESES[mes.getMonth()]} {mes.getFullYear()}
        </span>
        <button type="button" onClick={() => onMudarMes(1)} aria-label="Próximo mês">
          →
        </button>
      </div>

      <div className="resumo-fin__card">
        <span className="resumo-fin__rotulo">Recebido em {MESES[mes.getMonth()]}</span>
        <p className="resumo-fin__valor">{formatarMoedaResumo(recebidoMes)}</p>
        {deltaPct != null && (
          <p className={`resumo-fin__delta ${deltaPct < 0 ? "resumo-fin__delta--baixa" : ""}`}>
            {deltaPct > 0 ? "↑" : deltaPct < 0 ? "↓" : ""} {Math.abs(deltaPct)}% vs. mês anterior
          </p>
        )}
        <div className="resumo-fin__barra">
          <span style={{ width: `${pctRecebido}%` }} />
        </div>
        <div className="resumo-fin__barra-legenda">
          <span>{pctRecebido}% recebido</span>
          <span>{formatarMoedaResumo(aReceberDoMes)} a receber</span>
        </div>
      </div>

      <div className="resumo-fin__chips">
        <div className="chip">
          <span className="chip__rotulo">Sessões pagas</span>
          <p className="chip__valor">
            {pagosDoMes.length}
            <span className="chip__valor-sec">/{doMes.length}</span>
          </p>
        </div>
        <div className="chip">
          <span className="chip__rotulo">Ticket médio</span>
          <p className="chip__valor chip__valor--mono">{formatarMoedaResumo(ticketMedio)}</p>
        </div>
        <div className="chip">
          <span className="chip__rotulo">Vencidos</span>
          <p className="chip__valor chip__valor--mono">{formatarMoedaResumo(totalVencido)}</p>
          {pacientesVencidos > 0 && (
            <span className="chip__apoio">
              {pacientesVencidos} paciente{pacientesVencidos === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <section className="resumo-fin__secao">
        <h2>A receber</h2>
        {aReceberOrdenado.length === 0 ? (
          <p className="resumo-fin__vazio">Nada em aberto — tudo recebido.</p>
        ) : (
          <ul className="resumo-fin__lista">
            {aReceberOrdenado.map((lancamento) => {
              const dias = diferencaEmDias(lancamento.vencimento, hojeISO);
              const numero = numeroWhatsappOuNull(lancamento.telefone);
              return (
                <li key={lancamento.id} className="resumo-fin__item">
                  <div className="resumo-fin__item-texto">
                    <p>{lancamento.paciente}</p>
                    <span className={dias < 0 ? "resumo-fin__prazo resumo-fin__prazo--atrasado" : "resumo-fin__prazo"}>
                      {dias < 0 ? `venceu há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"}` : dias === 0 ? "vence hoje" : `vence em ${dias} dias`}
                    </span>
                  </div>
                  <span className="resumo-fin__item-valor">{formatarMoeda(lancamento.valor)}</span>
                  {numero ? (
                    <a
                      className="resumo-fin__cobrar"
                      href={linkWhatsapp(
                        lancamento.telefone,
                        `Olá, ${primeiroNome(lancamento.paciente)}! Aqui é a Dra. Raquel Fróis. Passando para lembrar que há um pagamento de ${formatarMoeda(lancamento.valor)} em aberto.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Cobrar
                    </a>
                  ) : (
                    <span className="resumo-fin__cobrar resumo-fin__cobrar--desabilitado" title="Paciente sem telefone cadastrado">
                      Cobrar
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function paraISOMes(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function paraISODia(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function diferencaEmDias(vencimentoISO, hojeISO) {
  const a = new Date(`${vencimentoISO}T00:00:00`);
  const b = new Date(`${hojeISO}T00:00:00`);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function numeroWhatsappOuNull(telefone) {
  if (!telefone) return null;
  const digitos = telefone.replace(/\D/g, "");
  return digitos || null;
}

function primeiroNome(nomeCompleto) {
  return (nomeCompleto ?? "").trim().split(" ")[0] || "tudo bem";
}
