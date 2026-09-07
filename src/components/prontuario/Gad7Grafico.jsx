import { GAD7_MAX, severidadeGad7 } from "../../lib/sessao.js";
import "./Gad7Grafico.css";

const COR_TOM = {
  minima: "var(--text-4)",
  leve: "var(--info)",
  moderada: "var(--warning)",
  severa: "var(--danger)",
};

/** `avaliacoes` em ordem cronológica (mais antiga primeiro), até 6 itens. */
export default function Gad7Grafico({ avaliacoes }) {
  if (avaliacoes.length === 0) {
    return <p className="gad7-grafico__vazio">Nenhuma avaliação GAD-7 registrada ainda.</p>;
  }

  const primeira = avaliacoes[0].pontuacao;
  const ultima = avaliacoes[avaliacoes.length - 1].pontuacao;
  const tendencia = descreverTendencia(primeira, ultima);

  return (
    <div className="gad7-grafico">
      <div className="gad7-grafico__barras">
        {avaliacoes.map((avaliacao) => {
          const severidade = severidadeGad7(avaliacao.pontuacao);
          const altura = Math.max(8, Math.round((avaliacao.pontuacao / GAD7_MAX) * 100));
          return (
            <span
              key={avaliacao.id}
              className="gad7-grafico__barra"
              style={{ height: `${altura}%`, background: COR_TOM[severidade.tom] }}
              title={`${avaliacao.pontuacao}/${GAD7_MAX} · ${severidade.rotulo} · ${new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              }).format(new Date(avaliacao.criado_em))}`}
            />
          );
        })}
      </div>
      {avaliacoes.length > 1 && (
        <p className="gad7-grafico__tendencia">
          {primeira} → {ultima} <span>{tendencia}</span>
        </p>
      )}
    </div>
  );
}

function descreverTendencia(primeira, ultima) {
  const diferenca = ultima - primeira;
  if (diferenca <= -3) return "redução sustentada";
  if (diferenca < 0) return "em queda";
  if (diferenca === 0) return "estável";
  if (diferenca < 3) return "leve alta";
  return "em alta — atenção";
}
