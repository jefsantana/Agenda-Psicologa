import { useNavigate } from "react-router-dom";
import { IconeCifrao, IconePacienteMais, IconeProntuarioMais, IconeWhatsapp } from "./icons.jsx";
import "./AcoesRapidas.css";

/** "Novo atendimento" não entra aqui — é o botão primário do header (ver AppShell). */
export default function AcoesRapidas({ aoNovoPaciente, aoWhatsapp }) {
  const navigate = useNavigate();

  return (
    <section className="acoes-rapidas">
      <h2 className="acoes-rapidas__titulo">Ações rápidas</h2>
      <div className="acoes-rapidas__grade">
        <button type="button" className="acao" style={{ "--acao-cor": "var(--primary-text)" }} onClick={aoNovoPaciente}>
          <IconePacienteMais />
          Novo paciente
        </button>

        <button
          type="button"
          className="acao"
          style={{ "--acao-cor": "var(--primary-text)" }}
          onClick={() => navigate("/prontuarios")}
        >
          <IconeProntuarioMais />
          Prontuário
        </button>

        <button type="button" className="acao" style={{ "--acao-cor": "var(--success)" }} onClick={aoWhatsapp}>
          <IconeWhatsapp />
          WhatsApp
        </button>

        <button
          type="button"
          className="acao"
          style={{ "--acao-cor": "var(--primary-text)" }}
          onClick={() => navigate("/financeiro")}
        >
          <IconeCifrao />
          Recebimento
        </button>
      </div>
    </section>
  );
}
