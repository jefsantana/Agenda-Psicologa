import "./DonutConvenios.css";

const PALETA = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--pink)", "var(--amber)"];
const NOMES_MES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export default function DonutConvenios({ atendimentosDoMes, carregando }) {
  const contagem = new Map();
  for (const atendimento of atendimentosDoMes) {
    contagem.set(atendimento.convenio, (contagem.get(atendimento.convenio) ?? 0) + 1);
  }

  const total = atendimentosDoMes.length;
  const mesRotulo = NOMES_MES[new Date().getMonth()];
  const fatias = distribuirPercentuais(
    [...contagem.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([nome, quantidade], index) => ({ nome, quantidade, cor: PALETA[index % PALETA.length] })),
    total
  );

  return (
    <section className="convenios-painel">
      <div className="convenios-painel__cabecalho">
        <h2>Atendimentos por convênio</h2>
        <span className="convenios-painel__mes">{mesRotulo}</span>
      </div>

      {carregando ? (
        <>
          <div className="convenios-painel__total">
            <span className="skeleton" style={{ "--skeleton-w": "3ch", "--skeleton-h": "28px" }} />
          </div>
          <div className="convenios-barra" aria-hidden="true">
            <span className="skeleton" style={{ "--skeleton-w": "100%", "--skeleton-h": "8px" }} />
          </div>
        </>
      ) : total === 0 ? (
        <p className="convenios-painel__vazio">Sem atendimentos registrados este mês ainda.</p>
      ) : (
        <>
          <div className="convenios-painel__total">
            <span className="convenios-painel__total-numero">{total}</span>
            <span className="convenios-painel__total-rotulo">sessões</span>
          </div>

          <div className="convenios-barra">
            {fatias.map((fatia) => (
              <span
                key={fatia.nome}
                className="convenios-barra__segmento"
                style={{ flex: fatia.quantidade, background: fatia.cor }}
                title={`${fatia.nome}: ${fatia.percentual}%`}
              />
            ))}
          </div>

          <ul className="convenios-legenda">
            {fatias.map((fatia) => (
              <li key={fatia.nome} className="convenios-legenda__item">
                <span className="convenios-legenda__ponto" style={{ background: fatia.cor }} />
                <span className="convenios-legenda__nome">{fatia.nome}</span>
                <span className="convenios-legenda__pct">{fatia.percentual}%</span>
                <span className="convenios-legenda__contagem">{fatia.quantidade}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Método do maior resto: garante que os percentuais arredondados somem exatamente 100. */
function distribuirPercentuais(fatias, total) {
  if (total === 0) return fatias.map((f) => ({ ...f, percentual: 0 }));

  const brutos = fatias.map((f) => (f.quantidade / total) * 100);
  const arredondados = brutos.map((v) => Math.floor(v));
  const somaArredondada = arredondados.reduce((soma, v) => soma + v, 0);
  let restante = 100 - somaArredondada;

  const ordemPorResto = brutos
    .map((v, indice) => ({ indice, resto: v - Math.floor(v) }))
    .sort((a, b) => b.resto - a.resto);

  for (let k = 0; k < restante; k++) {
    arredondados[ordemPorResto[k % ordemPorResto.length].indice] += 1;
  }

  return fatias.map((f, indice) => ({ ...f, percentual: arredondados[indice] }));
}
