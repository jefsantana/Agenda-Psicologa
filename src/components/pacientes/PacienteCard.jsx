import { Link } from "react-router-dom";
import PacienteStatusBadge from "./PacienteStatusBadge.jsx";
import { IconeWhatsapp } from "../dashboard/icons.jsx";
import { formatarHora, mesmaData, rotuloDia } from "../../lib/date.js";
import "./PacienteCard.css";

const FAIXA_ETARIA_LABEL = { crianca: "Criança", adolescente: "Adolescente", adulto: "Adulto" };

export default function PacienteCard({ paciente, proximoAtendimento, onClick, onWhatsapp }) {
  const iniciais = iniciaisDoNome(paciente.nome);
  const faixaEtaria = FAIXA_ETARIA_LABEL[paciente.faixa_etaria];

  return (
    <li className="paciente-card">
      <button type="button" className="paciente-card__botao" onClick={onClick}>
        <span className="paciente-card__avatar">{iniciais}</span>
        <div className="paciente-card__texto">
          <p className="paciente-card__nome">{paciente.nome}</p>
          <span className="paciente-card__sub">
            {proximoAtendimento ? `${rotuloProximaSessao(proximoAtendimento)} · ` : ""}
            {paciente.convenio?.nome ?? "Particular"}
            {faixaEtaria ? ` · ${faixaEtaria}` : ""}
          </span>
        </div>
        <PacienteStatusBadge status={paciente.status} />
      </button>

      <div className="paciente-card__acoes">
        {paciente.telefone && (
          <button
            type="button"
            className="paciente-card__whatsapp"
            onClick={(event) => {
              event.stopPropagation();
              onWhatsapp?.();
            }}
            aria-label={`Enviar WhatsApp para ${paciente.nome}`}
          >
            <IconeWhatsapp />
            WhatsApp
          </button>
        )}

        <Link
          to={`/prontuarios?paciente=${paciente.id}`}
          className="paciente-card__prontuario"
          onClick={(event) => event.stopPropagation()}
        >
          Prontuário
        </Link>
      </div>
    </li>
  );
}

function rotuloProximaSessao(data) {
  const dia = mesmaData(data, new Date()) ? "Hoje" : capitalizar(rotuloDia(data));
  return `${dia} ${formatarHora(data)}`;
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function iniciaisDoNome(nome) {
  const partes = nome.trim().split(/\s+/);
  return partes.slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}
