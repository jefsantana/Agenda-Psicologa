import StatusBadge from "../dashboard/StatusBadge.jsx";
import MenuAcoesLinha from "./MenuAcoesLinha.jsx";
import { apagarAtendimento } from "../../lib/agenda.js";
import { formatarHora, mesmaData } from "../../lib/date.js";
import "./AtendimentoRow.css";

const TIPO_LABEL = { online: "Online", presencial: "Presencial" };
const STATUS_RESOLVIDOS = ["realizado", "falta", "remarcar", "cancelado"];

export default function AtendimentoRow({ item, index = 0, onClick, onExcluido }) {
  if (item.tipoLinha === "bloqueio") {
    return (
      <li className="atd-linha atd-linha--bloqueada" style={{ animationDelay: `${index * 30}ms` }}>
        <button type="button" className="atd-linha__botao atd-linha__botao--bloqueio" onClick={onClick}>
          <span className="atd-linha__hora">
            {formatarHora(item.inicio)}–{formatarHora(item.fim)}
          </span>
          <div className="atd-linha__corpo">
            <p className="atd-linha__titulo">Intervalo</p>
            <span className="atd-linha__sub">{item.motivo ?? "Bloqueado"}</span>
          </div>
        </button>
      </li>
    );
  }

  const precisaConfirmar = item.inicio <= new Date() && !STATUS_RESOLVIDOS.includes(item.status);
  // Sem confirmação num dia anterior é atraso de verdade; no próprio dia é só
  // o lembrete de rotina de fim de expediente — cada um recebe um tom diferente.
  const atrasado = precisaConfirmar && !mesmaData(item.inicio, new Date());

  async function handleExcluir() {
    if (!window.confirm(`Excluir este atendimento de ${item.paciente}? Essa ação não pode ser desfeita.`)) return;
    try {
      await apagarAtendimento(item.id);
      onExcluido?.();
    } catch (erro) {
      window.alert(erro.message ?? "Não foi possível excluir agora.");
    }
  }

  return (
    <li
      className={`atd-linha ${atrasado ? "atd-linha--atrasado" : precisaConfirmar ? "atd-linha--pendente" : ""}`}
      style={{ "--linha-cor": item.tipo === "online" ? "var(--info)" : "var(--primary)", animationDelay: `${index * 30}ms` }}
    >
      <div className="atd-linha__envolvedor">
        <button type="button" className="atd-linha__botao" onClick={onClick}>
          <span className="atd-linha__hora">{formatarHora(item.inicio)}</span>
          <div className="atd-linha__corpo">
            <p className="atd-linha__titulo">{item.paciente}</p>
            <span className="atd-linha__sub">
              {TIPO_LABEL[item.tipo]}
              {item.convenio ? ` · ${item.convenio}` : ""}
              {atrasado ? " · Sem confirmação (dia anterior)" : precisaConfirmar ? " · Sem confirmação" : ""}
            </span>
          </div>
          <StatusBadge status={item.status} />
        </button>
        <MenuAcoesLinha onEditar={onClick} onExcluir={handleExcluir} />
      </div>
    </li>
  );
}
