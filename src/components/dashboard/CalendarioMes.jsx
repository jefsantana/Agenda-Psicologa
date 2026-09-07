import { useEffect, useState } from "react";
import { IconeSeta } from "./icons.jsx";
import { paraISO } from "../../lib/date.js";
import { feriadoEm } from "../../lib/feriados.js";
import "./CalendarioMes.css";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/**
 * `selecionado`/`onSelecionar` são opcionais: sem eles, o calendário guarda
 * o dia escolhido internamente (uso no dashboard, onde selecionar é só
 * visual). `marcados` é um Set de datas "yyyy-mm-dd" com atendimento.
 * `inicioIntervalo`/`fimIntervalo` (opcionais) pintam um intervalo de dias
 * selecionado (uso na Agenda, ao escolher "entre 12 e 14", por exemplo).
 */
export default function CalendarioMes({
  selecionado: selecionadoControlado,
  onSelecionar,
  marcados,
  pendentes,
  mesInicial,
  onMesMudar,
  inicioIntervalo,
  fimIntervalo,
}) {
  const hoje = new Date();
  const [mesVisivel, setMesVisivel] = useState(mesInicial ?? new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [selecionadoInterno, setSelecionadoInterno] = useState(hoje);

  const selecionado = selecionadoControlado ?? selecionadoInterno;
  const celulas = construirCelulas(mesVisivel);

  useEffect(() => {
    onMesMudar?.(mesVisivel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesVisivel.getFullYear(), mesVisivel.getMonth()]);

  function selecionar(data) {
    if (onSelecionar) onSelecionar(data);
    else setSelecionadoInterno(data);
  }

  return (
    <section className="calendario">
      <div className="calendario__cabecalho">
        <h2>
          {NOMES_MES[mesVisivel.getMonth()]} {mesVisivel.getFullYear()}
        </h2>
        <div className="calendario__nav">
          <button type="button" aria-label="Mês anterior" onClick={() => mudarMes(-1)}>
            <IconeSeta style={{ transform: "rotate(180deg)" }} />
          </button>
          <button type="button" aria-label="Próximo mês" onClick={() => mudarMes(1)}>
            <IconeSeta />
          </button>
        </div>
      </div>

      <div className="calendario__grade calendario__grade--cabecalho">
        {DIAS_SEMANA.map((dia, index) => (
          <span key={`${dia}-${index}`}>{dia}</span>
        ))}
      </div>

      <div className="calendario__grade">
        {celulas.map(({ data, foraDoMes }) => {
          const ehHoje = mesmaData(data, hoje);
          const ehSelecionado = mesmaData(data, selecionado);
          const dataISO = paraISO(data);
          const emIntervalo =
            inicioIntervalo && fimIntervalo && dataISO >= paraISO(inicioIntervalo) && dataISO <= paraISO(fimIntervalo);
          const pontaIntervalo =
            (inicioIntervalo && dataISO === paraISO(inicioIntervalo)) || (fimIntervalo && dataISO === paraISO(fimIntervalo));
          const temPendencia = pendentes?.has(dataISO);
          const temMarca = marcados?.has(dataISO);
          const nomeFeriado = feriadoEm(dataISO);
          return (
            <button
              key={data.toISOString()}
              type="button"
              className={`calendario__dia ${foraDoMes ? "calendario__dia--fora" : ""} ${
                ehSelecionado ? "calendario__dia--selecionado" : ""
              } ${ehHoje && !ehSelecionado ? "calendario__dia--hoje" : ""} ${
                emIntervalo && !pontaIntervalo ? "calendario__dia--intervalo" : ""
              } ${pontaIntervalo ? "calendario__dia--intervalo-ponta" : ""} ${
                nomeFeriado ? "calendario__dia--feriado" : ""
              }`}
              onClick={() => selecionar(data)}
              title={nomeFeriado ?? undefined}
              aria-label={nomeFeriado ? `${data.getDate()}, feriado: ${nomeFeriado}` : undefined}
            >
              {data.getDate()}
              {(temMarca || temPendencia) && (
                <span
                  className={`calendario__ponto ${temPendencia ? "calendario__ponto--pendencia" : ""}`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {(marcados || pendentes) && (
        <div className="calendario__legenda">
          <span className="calendario__legenda-item">
            <span className="calendario__legenda-ponto" /> com sessões
          </span>
          <span className="calendario__legenda-item">
            <span className="calendario__legenda-ponto calendario__legenda-ponto--pendencia" /> pendência
          </span>
          <span className="calendario__legenda-item">
            <span className="calendario__legenda-ponto calendario__legenda-ponto--feriado" /> feriado
          </span>
        </div>
      )}
    </section>
  );

  function mudarMes(delta) {
    setMesVisivel(new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + delta, 1));
  }
}

function construirCelulas(mesVisivel) {
  const primeiroDiaSemana = mesVisivel.getDay();
  const inicioGrade = new Date(mesVisivel);
  inicioGrade.setDate(1 - primeiroDiaSemana);

  return Array.from({ length: 42 }, (_, i) => {
    const data = new Date(inicioGrade);
    data.setDate(inicioGrade.getDate() + i);
    return { data, foraDoMes: data.getMonth() !== mesVisivel.getMonth() };
  });
}

function mesmaData(a, b) {
  return a.toDateString() === b.toDateString();
}
