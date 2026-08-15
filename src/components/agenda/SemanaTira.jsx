import { semanaAtual } from "../../lib/date.js";
import "./SemanaTira.css";

const LETRA_DIA = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function SemanaTira({ dataSelecionada, onSelecionar }) {
  const dias = semanaAtual(dataSelecionada);
  const hoje = new Date();

  return (
    <div className="semana-tira">
      {dias.map((dia) => {
        const selecionado = mesmaData(dia, dataSelecionada);
        const ehHoje = mesmaData(dia, hoje);
        return (
          <button
            key={dia.toISOString()}
            type="button"
            className={`semana-tira__dia ${selecionado ? "semana-tira__dia--selecionado" : ""} ${
              ehHoje && !selecionado ? "semana-tira__dia--hoje" : ""
            }`}
            onClick={() => onSelecionar(dia)}
          >
            <span className="semana-tira__letra">{LETRA_DIA[dia.getDay()]}</span>
            <span className="semana-tira__numero">{dia.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}

function mesmaData(a, b) {
  return a.toDateString() === b.toDateString();
}
