import KpiCard from "./KpiCard.jsx";
import { IconeAlerta, IconeChecklist, IconeCifrao, IconeRelogio, IconeSetaCima } from "./icons.jsx";
import { formatarMinutos, formatarMoedaResumo } from "../../lib/date.js";

/**
 * Faixa de KPIs do dashboard — seção 3 do redesign. Cada card tem peso visual
 * próprio (não são 4 números idênticos competindo entre si). Recebe já pronto o
 * objeto `kpis` calculado na página; enquanto `carregando`, mostra um skeleton
 * com a mesma altura final (sem pulo de layout quando os dados chegam).
 */
export default function DashboardKpis({ kpis, carregando }) {
  return (
    <div className="dashboard__kpis">
      <KpiAtendimentosHoje dados={kpis?.hoje} carregando={carregando} />
      <KpiProximo dados={kpis?.proximo} carregando={carregando} />
      <KpiFaltas dados={kpis?.faltas} carregando={carregando} />
      <KpiFinanceiro dados={kpis?.financeiro} carregando={carregando} />
    </div>
  );
}

function ValorSkeleton({ largura = "2.2ch" }) {
  return <span className="skeleton" style={{ "--skeleton-w": largura, "--skeleton-h": "1em" }} />;
}

function ApoioSkeleton({ largura = "70%" }) {
  return <span className="skeleton" style={{ "--skeleton-w": largura, "--skeleton-h": "0.85em" }} />;
}

function KpiAtendimentosHoje({ dados, carregando }) {
  const concluidos = dados?.concluidos ?? 0;
  const total = dados?.total ?? 0;
  const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  if (carregando) {
    return (
      <KpiCard rotulo="Atendimentos hoje" icone={<IconeChecklist />}>
        <p className="kpi__valor">
          <ValorSkeleton />
        </p>
        <div className="kpi__progresso" aria-hidden="true" />
        <p className="kpi__apoio">
          <ApoioSkeleton />
        </p>
      </KpiCard>
    );
  }

  return (
    <KpiCard rotulo="Atendimentos hoje" icone={<IconeChecklist />}>
      <p className="kpi__valor">
        {concluidos}
        <span className="kpi__valor-sec">/ {total}</span>
      </p>
      <div className="kpi__progresso" aria-hidden="true">
        <span className="kpi__progresso-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="kpi__apoio">{legendaConcluidos(concluidos, total)}</p>
    </KpiCard>
  );
}

function KpiProximo({ dados, carregando }) {
  if (carregando) {
    return (
      <KpiCard rotulo="Próximo atendimento" icone={<IconeRelogio />}>
        <p className="kpi__valor">
          <ValorSkeleton largura="4ch" />
        </p>
        <p className="kpi__apoio-forte">
          <ApoioSkeleton largura="55%" />
        </p>
        <p className="kpi__apoio">
          <ApoioSkeleton largura="40%" />
        </p>
      </KpiCard>
    );
  }

  return (
    <KpiCard rotulo="Próximo atendimento" icone={<IconeRelogio />}>
      {dados ? (
        <>
          <p className="kpi__valor kpi__valor--mono">{dados.hora}</p>
          <p className="kpi__apoio-forte">{dados.paciente}</p>
          <p className="kpi__apoio">
            {dados.emMinutos != null ? `em ${formatarMinutos(dados.emMinutos)} · ` : ""}
            {dados.tipo === "online" ? "online" : "presencial"}
          </p>
        </>
      ) : (
        <>
          <p className="kpi__valor kpi__valor--vazio">—</p>
          <p className="kpi__apoio">sem mais atendimentos hoje</p>
        </>
      )}
    </KpiCard>
  );
}

function KpiFaltas({ dados, carregando }) {
  const total = dados?.total ?? 0;
  const remarcacoes = dados?.remarcacoesAConfirmar ?? 0;

  if (carregando) {
    return (
      <KpiCard rotulo="Faltas e remarcações" icone={<IconeAlerta />}>
        <p className="kpi__valor">
          <ValorSkeleton />
        </p>
        <p className="kpi__apoio-forte">
          <ApoioSkeleton largura="60%" />
        </p>
        <p className="kpi__apoio">
          <ApoioSkeleton largura="80%" />
        </p>
      </KpiCard>
    );
  }

  return (
    <KpiCard rotulo="Faltas e remarcações" icone={<IconeAlerta />} tom={total > 0 ? "atencao" : undefined}>
      <p className="kpi__valor">
        {total}
        {total > 0 && <span className="kpi__tag">hoje</span>}
      </p>
      {total > 0 ? (
        <>
          <p className="kpi__apoio-forte">Ação pendente</p>
          <p className="kpi__apoio">{textoRemarcacoes(remarcacoes)}</p>
        </>
      ) : (
        <p className="kpi__apoio">nenhuma hoje</p>
      )}
    </KpiCard>
  );
}

function KpiFinanceiro({ dados, carregando }) {
  const recebido = dados?.recebidoMes ?? 0;
  const deltaPct = dados?.deltaPct ?? null;
  const aReceber = dados?.aReceber ?? 0;
  const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());

  if (carregando) {
    return (
      <KpiCard rotulo={`Recebido em ${nomeMes}`} icone={<IconeCifrao />}>
        <p className="kpi__valor">
          <ValorSkeleton largura="5ch" />
        </p>
        <p className="kpi__delta">
          <ApoioSkeleton largura="50%" />
        </p>
      </KpiCard>
    );
  }

  return (
    <KpiCard rotulo={`Recebido em ${nomeMes}`} icone={<IconeCifrao />}>
      <p className="kpi__valor kpi__valor--mono">
        <span className="kpi__prefixo">R$</span>
        {recebido.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
      </p>
      {deltaPct != null && (
        <p className={`kpi__delta ${deltaPct < 0 ? "kpi__delta--baixa" : ""}`}>
          <IconeSetaCima style={deltaPct < 0 ? { transform: "rotate(180deg)" } : undefined} />
          {deltaPct > 0 ? "+" : ""}
          {deltaPct}%<span className="kpi__delta-ref">vs. mês anterior</span>
        </p>
      )}
      {aReceber > 0 && <p className="kpi__apoio">{formatarMoedaResumo(aReceber)} a receber</p>}
    </KpiCard>
  );
}

function legendaConcluidos(concluidos, total) {
  if (total === 0) return "nenhum atendimento hoje";
  if (concluidos === 0) return "nenhum concluído ainda";
  if (concluidos >= total) return "todos concluídos";
  return `${concluidos} de ${total} concluídos`;
}

function textoRemarcacoes(n) {
  if (n === 0) return "sem remarcações a confirmar";
  if (n === 1) return "1 remarcação a confirmar";
  return `${n} remarcações a confirmar`;
}
