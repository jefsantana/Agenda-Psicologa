import "../dashboard/StatusBadge.css";

const LABEL = {
  ativo: "Ativo",
  pendente: "Pendente",
  novo: "Novo",
  inativo: "Inativo",
};

export default function PacienteStatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{LABEL[status] ?? status}</span>;
}
