import { formatarMoedaResumo } from "../../lib/date.js";
import "./DashboardChips.css";

/**
 * Versão condensada dos 4 KPIs para telas estreitas — 3 números que cabem
 * numa linha só, igual ao "Modelo App". A versão completa (DashboardKpis)
 * some abaixo de 1024px e esta assume o lugar (ver DashboardPage.css).
 */
export default function DashboardChips({ kpis, tarefasAtrasadas, carregando }) {
  const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());

  if (carregando) {
    return (
      <div className="dashboard__chips" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div className="chip" key={i}>
            <span className="skeleton" style={{ "--skeleton-w": "60%", "--skeleton-h": "0.7em" }} />
            <span className="skeleton" style={{ "--skeleton-w": "40%", "--skeleton-h": "1.3em", marginTop: "6px" }} />
          </div>
        ))}
      </div>
    );
  }

  const pendencias = tarefasAtrasadas + kpis.faltas.remarcacoesAConfirmar;

  return (
    <div className="dashboard__chips">
      <div className="chip">
        <span className="chip__rotulo">Hoje</span>
        <p className="chip__valor">
          {kpis.hoje.concluidos}
          <span className="chip__valor-sec">/{kpis.hoje.total}</span>
        </p>
      </div>

      <div className="chip">
        <span className="chip__rotulo">Pendências</span>
        <p className="chip__valor">{pendencias}</p>
        {pendencias > 0 && (
          <span className="chip__apoio">
            {tarefasAtrasadas} tarefa{tarefasAtrasadas === 1 ? "" : "s"} · {kpis.faltas.remarcacoesAConfirmar} remarcar
          </span>
        )}
      </div>

      <div className="chip">
        <span className="chip__rotulo">{nomeMes}</span>
        <p className="chip__valor chip__valor--mono">{formatarMoedaResumo(kpis.financeiro.recebidoMes)}</p>
        {kpis.financeiro.deltaPct != null && (
          <span className={`chip__apoio ${kpis.financeiro.deltaPct < 0 ? "chip__apoio--baixa" : "chip__apoio--alta"}`}>
            {kpis.financeiro.deltaPct > 0 ? "↑" : kpis.financeiro.deltaPct < 0 ? "↓" : ""}
            {Math.abs(kpis.financeiro.deltaPct)}%
          </span>
        )}
      </div>
    </div>
  );
}
