import { useState } from "react";
import { apagarTarefa, atualizarTarefa, criarTarefa, concluirTarefa } from "../../lib/tarefas.js";
import { buscarAtendimentoNoInstante } from "../../lib/agenda.js";
import { combinarDataHora, paraISO } from "../../lib/date.js";
import MenuAcoesLinha from "../agenda/MenuAcoesLinha.jsx";
import "./ProximosCompromissos.css";

const MESES_ABREV = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export default function ProximosCompromissos({ itens, aoAtualizar, carregando }) {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [concluindo, setConcluindo] = useState(null);

  function limpar() {
    setTitulo("");
    setData("");
    setHora("");
    setEditandoId(null);
    setErro("");
  }

  function abrirNovo() {
    limpar();
    setFormAberto(true);
  }

  function fecharForm() {
    limpar();
    setFormAberto(false);
  }

  function abrirEdicao(item) {
    setEditandoId(item.id);
    setTitulo(item.titulo);
    setData(item.vence_em ?? "");
    setHora(item.hora?.slice(0, 5) ?? "");
    setErro("");
    setFormAberto(true);
  }

  async function handleExcluir(item) {
    if (!window.confirm(`Excluir "${item.titulo}"?`)) return;
    try {
      await apagarTarefa(item.id);
      aoAtualizar?.();
    } catch (erroExcluir) {
      window.alert(erroExcluir.message ?? "Não foi possível excluir agora.");
    }
  }

  async function handleSalvar(event) {
    event.preventDefault();
    if (!titulo.trim() || !data || !hora) return;

    setSalvando(true);
    setErro("");
    try {
      const instante = combinarDataHora(data, hora);
      const conflito = await buscarAtendimentoNoInstante(instante);
      if (conflito) {
        setErro(`Você já tem ${conflito.paciente} agendado nesse horário — escolha outro horário.`);
        return;
      }

      if (editandoId) {
        await atualizarTarefa(editandoId, { titulo, venceEm: data, hora });
      } else {
        await criarTarefa({ titulo, venceEm: data, hora });
      }
      fecharForm();
      aoAtualizar?.();
    } finally {
      setSalvando(false);
    }
  }

  async function handleConcluir(id) {
    setConcluindo(id);
    try {
      await concluirTarefa(id);
      aoAtualizar?.();
    } finally {
      setConcluindo(null);
    }
  }

  return (
    <section className="proximos">
      <div className="proximos__cabecalho">
        <h2>Agenda pessoal</h2>
        <button type="button" className="proximos__adicionar" onClick={formAberto ? fecharForm : abrirNovo}>
          {formAberto ? "Cancelar" : "＋ Novo"}
        </button>
      </div>
      <span className="proximos__legenda">Lembretes que não são atendimentos</span>

      {formAberto && (
        <form className="proximos__form" onSubmit={handleSalvar}>
          <input
            className="proximos__form-titulo"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Ex.: Dentista, buscar filho na escola…"
          />
          <div className="proximos__form-linha">
            <input
              className="proximos__form-data"
              type="date"
              value={data}
              min={paraISO(new Date())}
              onChange={(event) => setData(event.target.value)}
            />
            <input
              className="proximos__form-hora"
              type="time"
              value={hora}
              onChange={(event) => setHora(event.target.value)}
            />
          </div>
          {erro && (
            <p className="proximos__form-erro" role="alert">
              {erro}
            </p>
          )}
          <button type="submit" disabled={!titulo.trim() || !data || !hora || salvando}>
            {salvando ? "Salvando…" : editandoId ? "Salvar" : "Adicionar"}
          </button>
        </form>
      )}

      {carregando ? (
        <ul className="proximos__lista" aria-hidden="true">
          {[0, 1].map((i) => (
            <li key={i} className="proximos__item">
              <span className="skeleton" style={{ "--skeleton-w": "34px", "--skeleton-h": "34px" }} />
              <span className="skeleton" style={{ "--skeleton-w": "60%", "--skeleton-h": "13px" }} />
            </li>
          ))}
        </ul>
      ) : itens.length === 0 ? (
        <p className="proximos__vazio">Nada pessoal marcado para os próximos dias.</p>
      ) : (
        <ul className="proximos__lista">
          {itens.map((item) => {
            const dataEvento = new Date(`${item.vence_em}T00:00:00`);
            return (
              <li key={item.id} className="proximos__item">
                <div className="proximos__data">
                  <span className="proximos__data-mes">
                    {MESES_ABREV[dataEvento.getMonth()]}
                  </span>
                  <span className="proximos__data-dia">{String(dataEvento.getDate()).padStart(2, "0")}</span>
                </div>
                <div className="proximos__corpo">
                  <p className="proximos__nome">{item.titulo}</p>
                  <span className="proximos__hora">{item.hora?.slice(0, 5)}</span>
                </div>
                <button
                  type="button"
                  className="proximos__concluir"
                  disabled={concluindo === item.id}
                  onClick={() => handleConcluir(item.id)}
                  aria-label={`Concluir: ${item.titulo}`}
                  title="Marcar como feito"
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4l2.8 2.8L9 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <MenuAcoesLinha onEditar={() => abrirEdicao(item)} onExcluir={() => handleExcluir(item)} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
