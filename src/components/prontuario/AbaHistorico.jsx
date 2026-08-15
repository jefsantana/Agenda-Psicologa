import StatusBadge from "../dashboard/StatusBadge.jsx";
import "../dashboard/StatusBadge.css";
import "./AbaHistorico.css";

const TIPO_LABEL = { online: "Online", presencial: "Presencial" };

export default function AbaHistorico({ historico }) {
  return (
    <section className="prontuario-secao">
      <h3>Histórico de atendimentos</h3>

      {historico.length === 0 ? (
        <p className="prontuario-seletor__vazio">Nenhum atendimento agendado ainda para este paciente.</p>
      ) : (
        <ul className="aba-historico__lista">
          {historico.map((item) => (
            <li key={item.id} className="aba-historico__card">
              <div className="aba-historico__cabecalho">
                <span className="aba-historico__titulo">
                  {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(item.inicio)}
                  {" · "}
                  {item.inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {TIPO_LABEL[item.tipo]}
                </span>
                <StatusBadge status={item.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
