import "./KpiCard.css";

export default function KpiCard({ cor, icone, rotulo, valor, legenda }) {
  return (
    <article className="kpi" style={{ "--kpi-cor": `var(--${cor})` }}>
      <div className="kpi__topo">
        <span className="kpi__icone">{icone}</span>
        <span className="kpi__rotulo">{rotulo}</span>
      </div>
      <p className="kpi__valor">{valor}</p>
      {legenda && <p className="kpi__legenda">{legenda}</p>}
    </article>
  );
}
