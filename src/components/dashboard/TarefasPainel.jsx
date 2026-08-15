import { useEffect, useState } from "react";
import { apagarTarefa, atualizarTarefa, concluirTarefa, criarTarefa } from "../../lib/tarefas.js";
import { paraISO } from "../../lib/date.js";
import MenuAcoesLinha from "../agenda/MenuAcoesLinha.jsx";
import "./TarefasPainel.css";

export default function TarefasPainel({ tarefas: tarefasIniciais, aoCriada }) {
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

  return (
    <section className="tarefas">
      <div className="tarefas__cabecalho">
        <h2>Tarefas e lembretes</h2>
        <button type="button" className="tarefas__adicionar" onClick={formAberto ? fecharForm : abrirNova}>
          {formAberto ? "Cancelar" : "+ Novo"}
        </button>
      </div>

      {formAberto && (
        <form className="tarefas__form" onSubmit={handleSalvar}>
          <input
            className="tarefas__form-titulo"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="O que precisa ser feito?"
            autoFocus
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

      {tarefas.length === 0 ? (
        <p className="tarefas__vazio">Nenhuma tarefa pendente. Toque em "+ Novo" para criar a primeira.</p>
      ) : (
        <ul className="tarefas__lista">
          {tarefas.map((tarefa) => {
            const prazo = rotuloPrazo(tarefa.vence_em);
            return (
              <li key={tarefa.id} className="tarefas__item">
                <button
                  type="button"
                  className="tarefas__checkbox"
                  onClick={() => handleConcluir(tarefa.id)}
                  aria-label={`Concluir: ${tarefa.titulo}`}
                  title="Marcar como concluída"
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4l2.8 2.8L9 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="tarefas__titulo">
                  {tarefa.titulo}
                  {tarefa.paciente?.nome ? ` — ${tarefa.paciente.nome}` : ""}
                </span>
                {prazo && <span className={`tarefas__prazo tarefas__prazo--${prazo.tom}`}>{prazo.texto}</span>}
                <MenuAcoesLinha onEditar={() => abrirEdicao(tarefa)} onExcluir={() => handleExcluir(tarefa)} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function rotuloPrazo(venceEm) {
  if (!venceEm) return null;
  const hojeISO = paraISO(new Date());
  if (venceEm < hojeISO) return { texto: "Atrasada", tom: "atrasada" };
  if (venceEm === hojeISO) return { texto: "Hoje", tom: "hoje" };
  return {
    texto: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${venceEm}T00:00:00`)),
    tom: "futura",
  };
}
