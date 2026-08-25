import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import MenuAcoesLinha from "../agenda/MenuAcoesLinha.jsx";
import { apagarAtendimento, atualizarStatusAtendimento } from "../../lib/agenda.js";
import { formatarHora } from "../../lib/date.js";
import "./AgendaDoDia.css";

const TIPO_LABEL = { online: "Online", presencial: "Presencial" };
const LIMITE_VISIVEL = 5;
const STATUS_RESOLVIDOS = ["realizado", "falta", "remarcar", "cancelado"];
const ACOES_CONFIRMACAO = [
  { status: "realizado", rotulo: "Atendido" },
  { status: "falta", rotulo: "Faltou" },
  { status: "remarcar", rotulo: "Reagendou" },
  { status: "cancelado", rotulo: "Cancelou" },
];

export default function AgendaDoDia({ itens, carregando, data, ehHoje, onVoltarHoje, onAtualizado, onEditarAtendimento }) {
  const visiveis = itens.slice(0, LIMITE_VISIVEL);
  const restantes = itens.length - visiveis.length;

  return (
    <section className="agenda-dia">
      <div className="agenda-dia__cabecalho">
        <div>
          <h2>{ehHoje ? "Agenda do dia" : "Agenda de outro dia"}</h2>
          <span className="agenda-dia__data">
            {new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(data)}
          </span>
        </div>
        {ehHoje ? (
          <Link to="/agenda" className="agenda-dia__ver-tudo">
            Ver agenda completa
          </Link>
        ) : (
          <button type="button" className="agenda-dia__ver-tudo" onClick={onVoltarHoje}>
            Voltar para hoje
          </button>
        )}
      </div>

      {carregando ? (
        <p className="agenda-dia__vazio">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="agenda-dia__vazio">
          {ehHoje ? 'Nenhum atendimento hoje. Use "Novo atendimento" para agendar.' : "Nenhum atendimento neste dia."}
        </p>
      ) : (
        <>
          <ul className="agenda-dia__lista">
            {visiveis.map((item, index) =>
              item.tipoLinha === "bloqueio" ? (
                <li key={item.id} className="agenda-linha agenda-linha--bloqueada" style={{ animationDelay: `${index * 40}ms` }}>
                  <span className="agenda-linha__hora">{formatarHora(item.inicio)}</span>
                  <div className="agenda-linha__corpo">
                    <p className="agenda-linha__titulo">Intervalo</p>
                    <span className="agenda-linha__sub">{item.motivo ?? "Bloqueado"}</span>
                  </div>
                </li>
              ) : (
                <LinhaAtendimento
                  key={item.id}
                  item={item}
                  index={index}
                  ehHoje={ehHoje}
                  onAtualizado={onAtualizado}
                  onEditar={onEditarAtendimento}
                />
              )
            )}
          </ul>

          {restantes > 0 && (
            <p className="agenda-dia__restantes">+ {restantes} atendimentos restantes</p>
          )}
        </>
      )}
    </section>
  );
}

function LinhaAtendimento({ item, index, ehHoje, onAtualizado, onEditar }) {
  const [confirmando, setConfirmando] = useState(false);
  const precisaConfirmar = item.inicio <= new Date() && !STATUS_RESOLVIDOS.includes(item.status);
  // No próprio dia é o lembrete de rotina de fim de expediente; num dia
  // anterior é atraso de verdade — cada um recebe um tom diferente.
  const atrasado = precisaConfirmar && !ehHoje;

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
      className={`agenda-linha ${atrasado ? "agenda-linha--atrasado" : precisaConfirmar ? "agenda-linha--pendente" : ""}`}
      style={{ "--linha-cor": corDoTipo(item.tipo), animationDelay: `${index * 40}ms` }}
    >
      <span className="agenda-linha__hora">{formatarHora(item.inicio)}</span>
      <div className="agenda-linha__corpo">
        <p className="agenda-linha__titulo">{item.paciente}</p>
        <span className="agenda-linha__sub">
          {TIPO_LABEL[item.tipo]}
          {item.convenio ? ` · ${item.convenio}` : ""}
        </span>
        {precisaConfirmar && (
          <div className="agenda-linha__confirmacao">
            <span className={`agenda-linha__confirmacao-aviso ${atrasado ? "agenda-linha__confirmacao-aviso--atrasado" : ""}`}>
              Confirme o que aconteceu:
            </span>
            <div className="agenda-linha__confirmacao-botoes">
              {ACOES_CONFIRMACAO.map((acao) => (
                <button
                  key={acao.status}
                  type="button"
                  disabled={confirmando}
                  onClick={() => handleConfirmar(acao.status)}
                >
                  {acao.rotulo}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <StatusBadge status={item.status} />
      <MenuAcoesLinha onEditar={() => onEditar?.(item)} onExcluir={handleExcluir} />
    </li>
  );
}

function corDoTipo(tipo) {
  return tipo === "online" ? "var(--info)" : "var(--primary)";
}
