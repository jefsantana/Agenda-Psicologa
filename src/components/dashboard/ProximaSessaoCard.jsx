import { Link } from "react-router-dom";
import { IconeCalendario, IconeWhatsapp } from "./icons.jsx";
import { formatarMinutos } from "../../lib/date.js";
import "./ProximaSessaoCard.css";

const TIPO_LABEL = { online: "Online", presencial: "Presencial" };

/** Card de destaque do próximo atendimento — não substitui o KPI, só dá ação rápida. */
export default function ProximaSessaoCard({ proximo, aoAbrirWhatsapp }) {
  return (
    <section className="proxima-sessao">
      <div className="proxima-sessao__eyebrow">
        <span className="proxima-sessao__ponto" aria-hidden="true" />
        PRÓXIMA SESSÃO {proximo.emMinutos != null ? `· EM ${formatarMinutos(proximo.emMinutos)}` : ""}
      </div>

      <div className="proxima-sessao__corpo">
        <span className="proxima-sessao__hora">{proximo.hora}</span>
        <div className="proxima-sessao__texto">
          <p className="proxima-sessao__nome">{proximo.paciente}</p>
          <span className="proxima-sessao__sub">
            {TIPO_LABEL[proximo.tipo] ?? proximo.tipo}
            {proximo.convenio ? ` · ${proximo.convenio}` : ""}
          </span>
        </div>
      </div>

      <div className="proxima-sessao__acoes">
        <Link to={`/atendimentos/${proximo.id}/sessao`} className="proxima-sessao__iniciar">
          ✓ Iniciar
        </Link>
        <Link to="/agenda" className="proxima-sessao__icone" aria-label="Ver agenda" title="Ver agenda">
          <IconeCalendario />
        </Link>
        <button
          type="button"
          className="proxima-sessao__icone"
          onClick={aoAbrirWhatsapp}
          aria-label="Enviar WhatsApp"
          title="Enviar WhatsApp"
        >
          <IconeWhatsapp />
        </button>
      </div>
    </section>
  );
}
