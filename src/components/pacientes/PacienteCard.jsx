import { Link } from "react-router-dom";
import PacienteStatusBadge from "./PacienteStatusBadge.jsx";
import { IconeWhatsapp } from "../dashboard/icons.jsx";
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
            {paciente.convenio?.nome ?? "Particular"}
            {faixaEtaria ? ` · ${faixaEtaria}` : ""}
            {proximoAtendimento
              ? ` · próxima ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(proximoAtendimento)}`
              : ""}
          </span>
        </div>
        <PacienteStatusBadge status={paciente.status} />
      </button>

      {paciente.telefone && (
        <button
          type="button"
          className="paciente-card__whatsapp"
          onClick={(event) => {
            event.stopPropagation();
            onWhatsapp?.();
          }}
          title="Enviar WhatsApp"
          aria-label={`Enviar WhatsApp para ${paciente.nome}`}
        >
          <IconeWhatsapp />
        </button>
      )}

      <Link
        to={`/prontuarios?paciente=${paciente.id}`}
        className="paciente-card__prontuario"
        onClick={(event) => event.stopPropagation()}
        title="Ver prontuário"
      >
        Prontuário
      </Link>
    </li>
  );
}

function iniciaisDoNome(nome) {
  const partes = nome.trim().split(/\s+/);
  return partes.slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}
