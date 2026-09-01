import "./KpiCard.css";

/**
 * Casca comum dos KPIs do dashboard (seção 3 do redesign): topo com rótulo à
 * esquerda e um ícone discreto à direita, sem barra colorida lateral. O corpo
 * de cada card é livre — cada KPI tem um conteúdo próprio (barra de progresso,
 * horário, tag de atenção, variação percentual).
 */
export default function KpiCard({ rotulo, icone, tom, children }) {
  return (
    <article className="kpi" data-tom={tom || undefined}>
      <div className="kpi__topo">
        <span className="kpi__rotulo">{rotulo}</span>
        {icone && (
          <span className="kpi__icone" aria-hidden="true">
            {icone}
          </span>
        )}
      </div>
      {children}
    </article>
  );
}
