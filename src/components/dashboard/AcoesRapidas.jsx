import { useNavigate } from "react-router-dom";
import { IconeMais, IconePacienteMais, IconeProntuarioMais, IconeWhatsapp } from "./icons.jsx";
import "./AcoesRapidas.css";

export default function AcoesRapidas({ aoNovoAtendimento, aoNovoPaciente, aoWhatsapp }) {
  const navigate = useNavigate();

  return (
    <section className="acoes-rapidas">
      <h2 className="acoes-rapidas__titulo">Ações rápidas</h2>
      <div className="acoes-rapidas__grade">
        <button type="button" className="acao" style={{ "--acao-cor": "var(--primary)" }} onClick={aoNovoAtendimento}>
          <span className="acao__icone">
            <IconeMais />
          </span>
          Novo atendimento
        </button>

        <button
          type="button"
          className="acao"
          style={{ "--acao-cor": "var(--success)" }}
          onClick={aoNovoPaciente}
        >
          <span className="acao__icone">
            <IconePacienteMais />
          </span>
          Novo paciente
        </button>

        <button
          type="button"
          className="acao"
          style={{ "--acao-cor": "var(--info)" }}
          onClick={() => navigate("/prontuarios")}
        >
          <span className="acao__icone">
            <IconeProntuarioMais />
          </span>
          Novo prontuário
        </button>

        <button type="button" className="acao" style={{ "--acao-cor": "var(--whatsapp)" }} onClick={aoWhatsapp}>
          <span className="acao__icone">
            <IconeWhatsapp />
          </span>
          WhatsApp
        </button>
      </div>
    </section>
  );
}
