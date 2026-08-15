import "./DonutConvenios.css";

const PALETA = ["var(--primary)", "var(--info)", "var(--success)", "var(--pink)", "var(--amber)"];

export default function DonutConvenios({ atendimentosDoMes }) {
  const contagem = new Map();
  for (const atendimento of atendimentosDoMes) {
    contagem.set(atendimento.convenio, (contagem.get(atendimento.convenio) ?? 0) + 1);
  }

  const total = atendimentosDoMes.length;
  const fatias = [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([nome, quantidade], index) => ({
      nome,
      quantidade,
      percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0,
      cor: PALETA[index % PALETA.length],
    }));

  const gradiente = construirGradiente(fatias, total);

  return (
    <section className="donut-painel">
      <h2 className="donut-painel__titulo">
        Atendimentos por convênio <span>(mês)</span>
      </h2>

      {total === 0 ? (
        <p className="donut-painel__vazio">Sem atendimentos registrados este mês ainda.</p>
      ) : (
        <>
          <div className="donut" style={{ background: gradiente }}>
            <div className="donut__furo">
              <span className="donut__total-numero">{total}</span>
              <span className="donut__total-rotulo">Total</span>
            </div>
          </div>

          <ul className="donut-legenda">
            {fatias.map((fatia) => (
              <li key={fatia.nome} className="donut-legenda__item">
                <span className="donut-legenda__ponto" style={{ background: fatia.cor }} />
                {fatia.nome} <strong>{fatia.percentual}%</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function construirGradiente(fatias, total) {
  if (total === 0) return "var(--surface-2)";
  let acumulado = 0;
  const paradas = fatias.map((fatia) => {
    const inicio = (acumulado / total) * 360;
    acumulado += fatia.quantidade;
    const fim = (acumulado / total) * 360;
    return `${fatia.cor} ${inicio}deg ${fim}deg`;
  });
  return `conic-gradient(${paradas.join(", ")})`;
}
