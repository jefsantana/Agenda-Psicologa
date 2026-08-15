import { useEffect, useState } from "react";
import StatusBadge from "../dashboard/StatusBadge.jsx";
import { buscarAtendimentosDoPaciente } from "../../lib/agenda.js";
import "./OutrasDatasPaciente.css";

/** Mostra os outros atendimentos já marcados para o paciente selecionado, para evitar duplicar horário sem perceber. */
export default function OutrasDatasPaciente({ pacienteId, excluirAtendimentoId }) {
  const [atendimentos, setAtendimentos] = useState([]);

  useEffect(() => {
    if (!pacienteId) {
      setAtendimentos([]);
      return;
    }
    buscarAtendimentosDoPaciente(pacienteId)
      .then((lista) => setAtendimentos(lista.filter((item) => item.id !== excluirAtendimentoId)))
      .catch(() => setAtendimentos([]));
  }, [pacienteId, excluirAtendimentoId]);

  if (!pacienteId || atendimentos.length === 0) return null;

  const visiveis = atendimentos.slice(0, 5);
  const restantes = atendimentos.length - visiveis.length;

  return (
    <div className="outras-datas">
      <span className="outras-datas__titulo">Outros atendimentos deste paciente</span>
      <ul className="outras-datas__lista">
        {visiveis.map((item) => (
          <li key={item.id}>
            <span>
              {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(item.inicio)}
              {" às "}
              {item.inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <StatusBadge status={item.status} />
          </li>
        ))}
      </ul>
      {restantes > 0 && <span className="outras-datas__restantes">+ {restantes} atendimento{restantes === 1 ? "" : "s"}</span>}
    </div>
  );
}
