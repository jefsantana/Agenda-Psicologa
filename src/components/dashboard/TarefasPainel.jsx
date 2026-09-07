import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { apagarTarefa, atualizarTarefa, concluirTarefa, criarTarefa } from "../../lib/tarefas.js";
import { paraISO } from "../../lib/date.js";
import MenuAcoesLinha from "../agenda/MenuAcoesLinha.jsx";
import "./TarefasPainel.css";

export default function TarefasPainel({ tarefas: tarefasIniciais, aoCriada, carregando }) {
  const [tarefas, setTarefas] = useState(tarefasIniciais);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [venceEm, setVenceEm] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setTarefas(tarefasIniciais);
  }, [tarefasIniciais]);

  async function handleConcluir(id) {
    const anteriores = tarefas;
    setTarefas((atuais) => atuais.filter((tarefa) => tarefa.id !== id)); // otimista

    try {
      await concluirTarefa(id);
    } catch {
      setTarefas(anteriores); // desfaz se der erro
    }
  }

  function limpar() {
    setTitulo("");
    setVenceEm("");
    setEditandoId(null);
  }

  function abrirNova() {
    limpar();
    setFormAberto(true);
  }

  function fecharForm() {
    limpar();
    setFormAberto(false);
  }

  function abrirEdicao(tarefa) {
    setEditandoId(tarefa.id);
    setTitulo(tarefa.titulo);
    setVenceEm(tarefa.vence_em ?? "");
    setFormAberto(true);
  }

  async function handleExcluir(tarefa) {
    if (!window.confirm(`Excluir "${tarefa.titulo}"?`)) return;
    try {
      await apagarTarefa(tarefa.id);
      aoCriada?.();
    } catch (erro) {
      window.alert(erro.message ?? "Não foi possível excluir agora.");
    }
  }

  async function handleSalvar(event) {
    event.preventDefault();
    if (!titulo.trim()) return;
    setSalvando(true);
    try {
      if (editandoId) {
        await atualizarTarefa(editandoId, { titulo, venceEm });
      } else {
        await criarTarefa({ titulo, venceEm });
      }
      fecharForm();
      aoCriada?.();
    } finally {
      setSalvando(false);
    }
  }

  const atrasadas = tarefas.filter((tarefa) => tarefa.vence_em && tarefa.vence_em < paraISO(new Date())).length;

  return (
    <section className="tarefas">
      <div className="tarefas__cabecalho">
        <h2>Tarefas</h2>
        {atrasadas > 0 && (
          <span className="tarefas__pill-atrasadas">
            {atrasadas} atrasada{atrasadas === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {formAberto && (
        <form className="tarefas__form" onSubmit={handleSalvar}>
          <input
            className="tarefas__form-titulo"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="O que precisa ser feito?"
          />
          <div className="tarefas__form-linha">
            <input
              className="tarefas__form-data"
              type="date"
              value={venceEm}
              min={paraISO(new Date())}
              onChange={(event) => setVenceEm(event.target.value)}
            />
            <button type="submit" disabled={!titulo.trim() || salvando}>
              {salvando ? "Salvando…" : editandoId ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <ul className="tarefas__lista" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="tarefas__item">
              <span className="skeleton" style={{ "--skeleton-w": "17px", "--skeleton-h": "17px", borderRadius: "5px" }} />
              <span className="skeleton" style={{ "--skeleton-w": "60%", "--skeleton-h": "13px" }} />
            </li>
          ))}
        </ul>
      ) : tarefas.length === 0 ? (
        <p className="tarefas__vazio">Nenhuma tarefa pendente.</p>
      ) : (
        <ul className="tarefas__lista">
          {tarefas.map((tarefa) => {
            const prazo = rotuloPrazo(tarefa.vence_em);
            return (
              <li key={tarefa.id} className="tarefas__item">
                <button
                  type="button"
                  className={`tarefas__checkbox ${prazo?.tom === "atrasada" ? "tarefas__checkbox--atrasada" : ""}`}
                  onClick={() => handleConcluir(tarefa.id)}
                  aria-label={`Concluir: ${tarefa.titulo}`}
                  title="Marcar como concluída"
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4l2.8 2.8L9 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="tarefas__texto">
                  <span className="tarefas__titulo">
                    {tarefa.titulo}
                    {tarefa.paciente?.nome ? ` · ${tarefa.paciente.nome}` : ""}
                  </span>
                  {prazo && <span className={`tarefas__prazo tarefas__prazo--${prazo.tom}`}>{prazo.texto}</span>}
                </div>
                <MenuAcoesLinha onEditar={() => abrirEdicao(tarefa)} onExcluir={() => handleExcluir(tarefa)} />
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" className="tarefas__nova" onClick={formAberto ? fecharForm : abrirNova}>
        <Plus size={13} strokeWidth={2.6} />
        {formAberto ? "Cancelar" : "Nova tarefa"}
      </button>
    </section>
  );
}

function rotuloPrazo(venceEm) {
  if (!venceEm) return null;
  const hoje = new Date(`${paraISO(new Date())}T00:00:00`);
  const vencimento = new Date(`${venceEm}T00:00:00`);
  const dias = Math.round((hoje.getTime() - vencimento.getTime()) / 86400000);

  if (dias > 0) {
    return { texto: dias === 1 ? "venceu ontem" : `venceu há ${dias} dias`, tom: "atrasada" };
  }
  if (dias === 0) return { texto: "hoje", tom: "hoje" };
  return {
    texto: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(vencimento),
    tom: "futura",
  };
}
