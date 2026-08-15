import { useEffect, useRef, useState } from "react";
import CalendarioMes from "../dashboard/CalendarioMes.jsx";
import { IconeCalendario, IconeSeta } from "../dashboard/icons.jsx";
import { paraISO } from "../../lib/date.js";
import "./SeletorDataAgenda.css";

const FORMATADOR_COMPLETO = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const FORMATADOR_CURTO = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const DATA_NENHUMA = new Date(0);

/**
 * Navegação de data da Agenda: setas de dia anterior/seguinte + um ícone que
 * abre um calendário para pular para qualquer data, ou escolher um intervalo
 * de dias (ex.: "entre 12 e 14").
 */
export default function SeletorDataAgenda({ periodo, onMudarPeriodo, marcados, onMesMudar }) {
  const [aberto, setAberto] = useState(false);
  const [modo, setModo] = useState("dia");
  const [intervaloInicio, setIntervaloInicio] = useState(null);
  const containerRef = useRef(null);

  const ehIntervalo = paraISO(periodo.inicio) !== paraISO(periodo.fim);

  useEffect(() => {
    function aoClicarFora(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  useEffect(() => {
    if (!aberto) {
      setIntervaloInicio(null);
      setModo(ehIntervalo ? "intervalo" : "dia");
    }
  }, [aberto, ehIntervalo]);

  function mudarDia(delta) {
    const proxima = new Date(periodo.inicio);
    proxima.setDate(proxima.getDate() + delta);
    onMudarPeriodo({ inicio: proxima, fim: proxima });
  }

  function selecionarDia(data) {
    onMudarPeriodo({ inicio: data, fim: data });
    setAberto(false);
  }

  function selecionarNoIntervalo(data) {
    if (!intervaloInicio) {
      setIntervaloInicio(data);
      return;
    }
    const [inicio, fim] = data < intervaloInicio ? [data, intervaloInicio] : [intervaloInicio, data];
    onMudarPeriodo({ inicio, fim });
    setIntervaloInicio(null);
    setAberto(false);
  }

  function irParaHoje() {
    const hoje = new Date();
    onMudarPeriodo({ inicio: hoje, fim: hoje });
    setAberto(false);
  }

  const rotulo = ehIntervalo
    ? `${FORMATADOR_CURTO.format(periodo.inicio)} – ${FORMATADOR_CURTO.format(periodo.fim)}`
    : capitalizar(FORMATADOR_COMPLETO.format(periodo.inicio));

  return (
    <div className="seletor-data-agenda" ref={containerRef}>
      {!ehIntervalo && (
        <button type="button" className="seletor-data-agenda__seta" aria-label="Dia anterior" onClick={() => mudarDia(-1)}>
          <IconeSeta style={{ transform: "rotate(180deg)" }} />
        </button>
      )}

      <button
        type="button"
        className="seletor-data-agenda__botao"
        onClick={() => setAberto((atual) => !atual)}
        aria-haspopup="dialog"
        aria-expanded={aberto}
      >
        <IconeCalendario />
        <span>{rotulo}</span>
      </button>

      {!ehIntervalo && (
        <button type="button" className="seletor-data-agenda__seta" aria-label="Dia seguinte" onClick={() => mudarDia(1)}>
          <IconeSeta />
        </button>
      )}

      {aberto && (
        <div className="seletor-data-agenda__popover" role="dialog" aria-label="Escolher data">
          <div className="seletor-data-agenda__modos" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={modo === "dia"}
              className={modo === "dia" ? "is-active" : ""}
              onClick={() => {
                setModo("dia");
                setIntervaloInicio(null);
              }}
            >
              Um dia
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modo === "intervalo"}
              className={modo === "intervalo" ? "is-active" : ""}
              onClick={() => setModo("intervalo")}
            >
              Intervalo
            </button>
          </div>

          {modo === "intervalo" && (
            <p className="seletor-data-agenda__dica">
              {intervaloInicio ? "Agora toque no dia final do intervalo." : "Toque no dia inicial do intervalo."}
            </p>
          )}

          {modo === "dia" ? (
            <CalendarioMes selecionado={periodo.inicio} onSelecionar={selecionarDia} marcados={marcados} onMesMudar={onMesMudar} />
          ) : (
            <CalendarioMes
              selecionado={DATA_NENHUMA}
              onSelecionar={selecionarNoIntervalo}
              marcados={marcados}
              onMesMudar={onMesMudar}
              inicioIntervalo={intervaloInicio ?? (ehIntervalo ? periodo.inicio : null)}
              fimIntervalo={intervaloInicio ? null : ehIntervalo ? periodo.fim : null}
            />
          )}

          <button type="button" className="seletor-data-agenda__hoje" onClick={irParaHoje}>
            Ir para hoje
          </button>
        </div>
      )}
    </div>
  );
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
