import "./StatusBadge.css";

const LABEL = {
  agendado: "Agendado",
  aguardando: "Aguardando",
  confirmado: "Confirmado",
  remarcar: "Remarcar",
  realizado: "Realizado",
  falta: "Falta",
  cancelado: "Cancelado",
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{LABEL[status] ?? status}</span>;
}
