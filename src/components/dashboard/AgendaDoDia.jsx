import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import MenuAcoesLinha from "../agenda/MenuAcoesLinha.jsx";
import { apagarAtendimento, atualizarStatusAtendimento } from "../../lib/agenda.js";
import { formatarHora, formatarMinutos, paraISO } from "../../lib/date.js";
import { feriadoEm } from "../../lib/feriados.js";
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
const CHAVE_VISUALIZACAO = "espaco-raquel-frois:agenda-do-dia:visualizacao";

function obterVisualizacaoSalva() {
  const salvo = localStorage.getItem(CHAVE_VISUALIZACAO);
  return salvo === "timeline" ? "timeline" : "lista";
}

export default function AgendaDoDia({ itens, carregando, data, ehHoje, onVoltarHoje, onAtualizado, onEditarAtendimento }) {
  const [visualizacao, setVisualizacao] = useState(obterVisualizacaoSalva);
  const feriado = feriadoEm(paraISO(data));
  const sessoes = itens.filter((item) => item.tipoLinha !== "bloqueio");
  const visiveis = sessoes.slice(0, LIMITE_VISIVEL);
  const restantes = sessoes.length - visiveis.length;
  const minutosTotais = sessoes.reduce((soma, item) => soma + minutosDoItem(item), 0);

  function mudarVisualizacao(valor) {
    setVisualizacao(valor);
    localStorage.setItem(CHAVE_VISUALIZACAO, valor);
  }

  return (
    <section className="agenda-dia">
      <div className="agenda-dia__cabecalho">
        <div>
          <div className="agenda-dia__titulo-linha">
            <h2>{ehHoje ? "Agenda do dia" : "Agenda de outro dia"}</h2>
            {feriado && (
              <span className="agenda-dia__feriado" title={feriado}>
                Feriado · {feriado}
              </span>
            )}
          </div>
          <span className="agenda-dia__data">
            {new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(data)}
            {sessoes.length > 0 && (
              <>
                {" · "}
                {sessoes.length} sessõe{sessoes.length === 1 ? "" : "s"} · {formatarMinutos(minutosTotais)} de atendimento
              </>
            )}
          </span>
        </div>
        <div className="agenda-dia__acoes-cabecalho">
          <div className="agenda-dia__toggle" role="tablist" aria-label="Visualização da agenda">
            <button
              type="button"
              role="tab"
              aria-selected={visualizacao === "lista"}
              className={visualizacao === "lista" ? "agenda-dia__toggle-item--ativo" : "agenda-dia__toggle-item"}
              onClick={() => mudarVisualizacao("lista")}
            >
              Lista
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={visualizacao === "timeline"}
              className={visualizacao === "timeline" ? "agenda-dia__toggle-item--ativo" : "agenda-dia__toggle-item"}
              onClick={() => mudarVisualizacao("timeline")}
            >
              Timeline
            </button>
          </div>
          {ehHoje ? (
            <Link to="/agenda" className="agenda-dia__ver-tudo">
              Ver tudo →
            </Link>
          ) : (
            <button type="button" className="agenda-dia__ver-tudo" onClick={onVoltarHoje}>
              Voltar para hoje
            </button>
          )}
        </div>
      </div>

      {carregando ? (
        <ul className="agenda-dia__lista" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="agenda-linha agenda-linha--skeleton">
              <div className="agenda-linha__hora-col">
                <span className="skeleton" style={{ "--skeleton-w": "34px", "--skeleton-h": "16px" }} />
              </div>
              <span className="agenda-linha__barra" />
              <span className="skeleton" style={{ "--skeleton-w": "38px", "--skeleton-h": "38px", borderRadius: "var(--radius-row)" }} />
              <div className="agenda-linha__corpo">
                <span className="skeleton" style={{ "--skeleton-w": "45%", "--skeleton-h": "14px" }} />
                <span className="skeleton" style={{ "--skeleton-w": "30%", "--skeleton-h": "12px", marginTop: "6px" }} />
              </div>
            </li>
          ))}
        </ul>
      ) : itens.length === 0 ? (
        <p className="agenda-dia__vazio">
          {ehHoje ? 'Nenhum atendimento hoje. Use "Novo atendimento" para agendar.' : "Nenhum atendimento neste dia."}
        </p>
      ) : visualizacao === "timeline" ? (
        <TimelineAgenda itens={itens} />
      ) : (
        <>
          <ul className="agenda-dia__lista">
            {visiveis.map((item) =>
              item.tipoLinha === "bloqueio" ? (
                <li key={item.id} className="agenda-linha agenda-linha--bloqueada">
                  <div className="agenda-linha__hora-col">
                    <span className="agenda-linha__hora">{formatarHora(item.inicio)}</span>
                  </div>
                  <div className="agenda-linha__corpo">
                    <p className="agenda-linha__titulo">Intervalo</p>
                    <span className="agenda-linha__sub">{item.motivo ?? "Bloqueado"}</span>
                  </div>
                </li>
              ) : (
                <LinhaAtendimento
                  key={item.id}
                  item={item}
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

function LinhaAtendimento({ item, ehHoje, onAtualizado, onEditar }) {
  const [confirmando, setConfirmando] = useState(false);
  const precisaConfirmar = item.inicio <= new Date() && !STATUS_RESOLVIDOS.includes(item.status);
  // No próprio dia é o lembrete de rotina de fim de expediente; num dia
  // anterior é atraso de verdade — cada um recebe um tom diferente.
  const atrasado = precisaConfirmar && !ehHoje;
  const concluido = item.status === "realizado";

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

  // Clique no corpo abre o detalhe (formulário de edição); botões internos
  // param a propagação para não reabrir o form junto com a própria ação.
  // Só o clique de mouse usa este atalho — a linha tem botões reais dentro
  // dela (Iniciar, Prontuário, ⋮ → Editar), então ela não pode ter seu
  // próprio role="button": um widget não pode aninhar outros widgets, e o
  // teclado já alcança a mesma ação de editar pelo menu "⋮".
  function handleClicarLinha() {
    onEditar?.(item);
  }

  return (
    <li
      className={`agenda-linha ${atrasado ? "agenda-linha--atrasado" : precisaConfirmar ? "agenda-linha--pendente" : ""} ${
        concluido ? "agenda-linha--concluida" : ""
      }`}
      style={{ "--linha-cor": corDoStatus(item.status) }}
      onClick={handleClicarLinha}
    >
      <div className="agenda-linha__hora-col">
        <span className="agenda-linha__hora">{formatarHora(item.inicio)}</span>
        <span className="agenda-linha__duracao">{formatarMinutos(minutosDoItem(item))}</span>
      </div>
      <span className="agenda-linha__barra" aria-hidden="true" />
      <span className="agenda-linha__avatar">{iniciaisDoNome(item.paciente)}</span>
      <div className="agenda-linha__corpo">
        <div className="agenda-linha__cabecalho">
          <p className="agenda-linha__titulo">{item.paciente}</p>
          <StatusBadge status={item.status} />
        </div>
        <span className="agenda-linha__sub">
          {TIPO_LABEL[item.tipo]}
          {item.convenio ? ` · ${item.convenio}` : ""}
        </span>
        {precisaConfirmar && (
          <div className="agenda-linha__confirmacao" onClick={(event) => event.stopPropagation()}>
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
      {!precisaConfirmar && (
        <>
          <div className="agenda-linha__acoes" onClick={(event) => event.stopPropagation()}>
            <Link to={`/atendimentos/${item.id}/sessao`} className="agenda-linha__acao-primaria">
              Iniciar
            </Link>
            <Link to="/prontuarios" className="agenda-linha__acao-secundaria">
              Prontuário
            </Link>
            <MenuAcoesLinha onEditar={() => onEditar?.(item)} onExcluir={handleExcluir} />
          </div>
          <span className="agenda-linha__chevron" aria-hidden="true">
            ›
          </span>
        </>
      )}
    </li>
  );
}

function TimelineAgenda({ itens }) {
  const sessoes = itens.filter((item) => item.tipoLinha !== "bloqueio");
  if (sessoes.length === 0) return null;

  const inicioMin = Math.min(...itens.map((item) => item.inicio.getHours() * 60 + item.inicio.getMinutes()));
  const fimMin = Math.max(...itens.map((item) => item.fim.getHours() * 60 + item.fim.getMinutes()));
  const inicioEixo = Math.max(0, Math.floor(inicioMin / 60) * 60 - 30);
  const fimEixo = Math.min(24 * 60, Math.ceil(fimMin / 60) * 60 + 30);
  const spanMin = Math.max(60, fimEixo - inicioEixo);
  const pxPorMin = 1.1;
  const horas = [];
  for (let h = Math.floor(inicioEixo / 60); h <= Math.ceil(fimEixo / 60); h++) horas.push(h);

  return (
    <div className="agenda-timeline" style={{ height: spanMin * pxPorMin }}>
      {horas.map((h) => (
        <div key={h} className="agenda-timeline__hora" style={{ top: (h * 60 - inicioEixo) * pxPorMin }}>
          <span>{String(h).padStart(2, "0")}:00</span>
          <span className="agenda-timeline__linha" />
        </div>
      ))}
      {itens.map((item) => {
        const inicioItemMin = item.inicio.getHours() * 60 + item.inicio.getMinutes();
        const fimItemMin = item.fim.getHours() * 60 + item.fim.getMinutes();
        const top = (inicioItemMin - inicioEixo) * pxPorMin;
        const altura = Math.max(22, (fimItemMin - inicioItemMin) * pxPorMin);
        if (item.tipoLinha === "bloqueio") {
          return (
            <div key={item.id} className="agenda-timeline__bloco agenda-timeline__bloco--bloqueio" style={{ top, height: altura }}>
              Intervalo
            </div>
          );
        }
        return (
          <div
            key={item.id}
            className="agenda-timeline__bloco"
            style={{ top, height: altura, "--linha-cor": corDoStatus(item.status) }}
          >
            <span className="agenda-timeline__bloco-hora">{formatarHora(item.inicio)}</span>
            <span className="agenda-timeline__bloco-nome">{item.paciente}</span>
          </div>
        );
      })}
    </div>
  );
}

function minutosDoItem(item) {
  return Math.max(0, Math.round((item.fim.getTime() - item.inicio.getTime()) / 60000));
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

function iniciaisDoNome(nome) {
  if (!nome) return "…";
  const partes = nome.trim().split(/\s+/);
  return partes.slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}
