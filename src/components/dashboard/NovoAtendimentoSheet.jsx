import { useState } from "react";
import { criarAtendimentoRapido } from "../../lib/agenda.js";
import { combinarDataHora, paraISO } from "../../lib/date.js";
import SeletorPacienteCampo from "../pacientes/SeletorPacienteCampo.jsx";
import OutrasDatasPaciente from "../agenda/OutrasDatasPaciente.jsx";

const DURACAO_PADRAO_MINUTOS = 50;

export default function NovoAtendimentoSheet({ aberto, aoFechar, aoSalvar }) {
  const [pacienteId, setPacienteId] = useState("");
  const [nomePaciente, setNomePaciente] = useState("");
  const [tipoPadrao, setTipoPadrao] = useState("presencial");
  const [data, setData] = useState(paraISO(new Date()));
  const [horario, setHorario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function limpar() {
    setPacienteId("");
    setNomePaciente("");
    setTipoPadrao("presencial");
    setData(paraISO(new Date()));
    setHorario("");
    setErro("");
  }

  function fechar() {
    limpar();
    aoFechar();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!pacienteId) {
      setErro(nomePaciente.trim() ? "Selecione o paciente na lista ou cadastre-o como novo." : "Selecione o paciente.");
      return;
    }
    if (!data || !horario) {
      setErro("Preencha a data e o horário.");
      return;
    }

    setSalvando(true);

    try {
      const inicio = combinarDataHora(data, horario);
      const fim = new Date(inicio.getTime() + DURACAO_PADRAO_MINUTOS * 60000);

      await criarAtendimentoRapido({ pacienteId, inicio, fim, tipo: tipoPadrao });
      limpar();
      aoFechar();
      aoSalvar?.();
    } catch (erroSalvar) {
      setErro(erroSalvar.message ?? "Não foi possível salvar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) return null;

  return (
    <div className="sheet sheet--novo-atendimento" role="dialog" aria-modal="true" aria-label="Novo atendimento">
      <button type="button" className="sheet__backdrop" onClick={fechar} aria-label="Fechar" />
      <form className="sheet__painel" onSubmit={handleSubmit}>
        <span className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__titulo">Novo atendimento</h2>

        <SeletorPacienteCampo
          pacienteId={pacienteId}
          nomePaciente={nomePaciente}
          onMudar={(paciente) => {
            setPacienteId(paciente.id);
            setNomePaciente(paciente.nome);
            setTipoPadrao(paciente.tipo_atendimento_padrao ?? "presencial");
          }}
          autoFocus
        />

        <OutrasDatasPaciente pacienteId={pacienteId} />

        <div className="sheet__linha">
          <label className="field">
            <span className="field__label">Data</span>
            <input className="field__input" type="date" value={data} onChange={(event) => setData(event.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Horário</span>
            <input
              className="field__input"
              type="time"
              value={horario}
              onChange={(event) => setHorario(event.target.value)}
            />
          </label>
        </div>

        {erro && (
          <p className="sheet__erro" role="alert">
            {erro}
          </p>
        )}

        <div className="sheet__acoes">
          <button type="button" className="sheet__cancelar" onClick={fechar}>
            Cancelar
          </button>
          <button type="submit" className="sheet__salvar" disabled={!pacienteId || !data || !horario || salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
