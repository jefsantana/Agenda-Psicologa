import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../dashboard/StatusBadge.jsx";
import MenuAcoesLinha from "./MenuAcoesLinha.jsx";
import { apagarAtendimento, atualizarStatusAtendimento } from "../../lib/agenda.js";
import { formatarHora, mesmaData } from "../../lib/date.js";
import "./AtendimentoRow.css";

const TIPO_LABEL = { online: "Online", presencial: "Presencial" };
const STATUS_RESOLVIDOS = ["realizado", "falta", "remarcar", "cancelado"];
const ACOES_CONFIRMACAO = [
  { status: "realizado", rotulo: "Atendido" },
  { status: "falta", rotulo: "Faltou" },
  { status: "remarcar", rotulo: "Reagendou" },
  { status: "cancelado", rotulo: "Cancelou" },
];

export default function AtendimentoRow({ item, onClick, onAtualizado }) {
  const [confirmando, setConfirmando] = useState(false);

  if (item.tipoLinha === "bloqueio") {
    return (
      <li className="atd-linha atd-linha--bloqueada">
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

  async function handleConfirmar(status) {
    setConfirmando(true);
    try {
      await atualizarStatusAtendimento(item.id, status);
      onAtualizado?.();
    } finally {
      setConfirmando(false);
    }
  }

  async function handleExcluir() {
    if (!window.confirm(`Excluir este atendimento de ${item.paciente}? Essa ação não pode ser desfeita.`)) return;
    try {
      await apagarAtendimento(item.id);
      onAtualizado?.();
    } catch (erro) {
      window.alert(erro.message ?? "Não foi possível excluir agora.");
    }
  }

  return (
    <li
      className={`atd-linha ${atrasado ? "atd-linha--atrasado" : precisaConfirmar ? "atd-linha--pendente" : ""}`}
      style={{ "--linha-cor": corDoStatus(item.status) }}
    >
      <div className="atd-linha__envolvedor">
        <button type="button" className="atd-linha__botao" onClick={onClick}>
          <span className="atd-linha__hora">{formatarHora(item.inicio)}</span>
          <div className="atd-linha__corpo">
            <div className="atd-linha__cabecalho">
              <p className="atd-linha__titulo">{item.paciente}</p>
              <StatusBadge status={item.status} />
            </div>
            <span className="atd-linha__sub">
              {TIPO_LABEL[item.tipo]}
              {item.convenio ? ` · ${item.convenio}` : ""}
              {atrasado ? " · confirmação atrasada" : ""}
            </span>
          </div>
        </button>
        <Link
          to={`/atendimentos/${item.id}/sessao`}
          className="atd-linha__sessao"
          onClick={(event) => event.stopPropagation()}
          aria-label="Iniciar sessão"
          title="Iniciar sessão"
        >
          ▶
        </Link>
        <MenuAcoesLinha onEditar={onClick} onExcluir={handleExcluir} />
      </div>

      {precisaConfirmar && (
        <div className="atd-linha__confirmacao">
          <span className={`atd-linha__confirmacao-aviso ${atrasado ? "atd-linha__confirmacao-aviso--atrasado" : ""}`}>
            Confirme o que aconteceu:
          </span>
          <div className="atd-linha__confirmacao-botoes">
            {ACOES_CONFIRMACAO.map((acao) => (
              <button key={acao.status} type="button" disabled={confirmando} onClick={() => handleConfirmar(acao.status)}>
                {acao.rotulo}
              </button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

function corDoStatus(status) {
  switch (status) {
    case "realizado":
      return "var(--success)";
    case "remarcar":
      return "var(--warning)";
    case "falta":
      return "var(--danger)";
    case "cancelado":
      return "var(--border-strong)";
    default:
      return "var(--primary)";
  }
}
