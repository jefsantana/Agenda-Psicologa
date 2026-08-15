import { useEffect, useState } from "react";
import { apagarAtendimento, salvarAtendimento } from "../../lib/agenda.js";
import { combinarDataHora, formatarHora, paraISO } from "../../lib/date.js";
import { paraNumero, paraTextoValor } from "../../lib/numero.js";
import SeletorPacienteCampo from "../pacientes/SeletorPacienteCampo.jsx";
import OutrasDatasPaciente from "./OutrasDatasPaciente.jsx";

const DURACOES = [30, 50, 60, 90];
const STATUS_OPCOES = ["agendado", "aguardando", "confirmado", "remarcar", "realizado", "falta", "cancelado"];
const STATUS_LABEL = {
  agendado: "Agendado",
  aguardando: "Aguardando",
  confirmado: "Confirmado",
  remarcar: "Remarcar",
  realizado: "Realizado",
  falta: "Falta",
  cancelado: "Cancelado",
};

export default function AtendimentoForm({ aberto, atendimento, dataPadrao, convenios, aoFechar, aoSalvar }) {
  const [pacienteId, setPacienteId] = useState("");
  const [nomePaciente, setNomePaciente] = useState("");
  const [data, setData] = useState(paraISO(dataPadrao));
  const [hora, setHora] = useState("");
  const [duracao, setDuracao] = useState(50);
  const [tipo, setTipo] = useState("presencial");
  const [convenioId, setConvenioId] = useState("");
  const [valor, setValor] = useState("");
  const [status, setStatus] = useState("agendado");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;

    if (atendimento) {
      setPacienteId(atendimento.pacienteId ?? "");
      setNomePaciente(atendimento.paciente ?? "");
      setData(paraISO(atendimento.inicio));
      setHora(formatarHora(atendimento.inicio));
      setDuracao(Math.round((atendimento.fim - atendimento.inicio) / 60000));
      setTipo(atendimento.tipo);
      setConvenioId(atendimento.convenioId ?? "");
      setValor(paraTextoValor(atendimento.valor));
      setStatus(atendimento.status);
    } else {
      setPacienteId("");
      setNomePaciente("");
      setData(paraISO(dataPadrao));
      setHora("");
      setDuracao(50);
      setTipo("presencial");
      setConvenioId("");
      setValor("");
      setStatus("agendado");
    }
    setErro("");
  }, [aberto, atendimento, dataPadrao]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!pacienteId) {
      setErro(nomePaciente.trim() ? "Selecione o paciente na lista ou cadastre-o como novo." : "Selecione o paciente.");
      return;
    }
    if (!hora) {
      setErro("Preencha o horário.");
      return;
    }

    setSalvando(true);
    try {
      const inicio = combinarDataHora(data, hora);
      const fim = new Date(inicio.getTime() + Number(duracao) * 60000);

      await salvarAtendimento({
        id: atendimento?.id,
        pacienteId,
        inicio,
        fim,
        tipo,
        convenioId,
        valor: paraNumero(valor) ?? "",
        status,
      });

      aoFechar();
      aoSalvar?.();
    } catch (erroSalvar) {
      setErro(erroSalvar.message ?? "Não foi possível salvar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    if (!atendimento) return;
    if (!window.confirm(`Excluir este atendimento de ${atendimento.paciente}? Essa ação não pode ser desfeita.`)) return;

    setErro("");
    setSalvando(true);
    try {
      await apagarAtendimento(atendimento.id);
      aoFechar();
      aoSalvar?.();
    } catch (erroExcluir) {
      setErro(erroExcluir.message ?? "Não foi possível excluir agora.");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) return null;

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Atendimento">
      <button type="button" className="sheet__backdrop" onClick={aoFechar} aria-label="Fechar" />
      <form className="sheet__painel" onSubmit={handleSubmit}>
        <span className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__titulo">{atendimento ? "Editar atendimento" : "Novo atendimento"}</h2>

        <div className="sheet__campos">
          <SeletorPacienteCampo
            pacienteId={pacienteId}
            nomePaciente={nomePaciente}
            onMudar={(paciente) => {
              setPacienteId(paciente.id);
              setNomePaciente(paciente.nome);
              if (!atendimento) setTipo(paciente.tipo_atendimento_padrao ?? "presencial");
            }}
            autoFocus
          />

          <OutrasDatasPaciente pacienteId={pacienteId} excluirAtendimentoId={atendimento?.id} />

          <div className="sheet__linha">
            <label className="field">
              <span className="field__label">Data</span>
              <input className="field__input" type="date" value={data} onChange={(event) => setData(event.target.value)} />
            </label>
            <label className="field">
              <span className="field__label">Horário</span>
              <input className="field__input" type="time" value={hora} onChange={(event) => setHora(event.target.value)} />
            </label>
          </div>

          <div className="sheet__linha">
            <label className="field">
              <span className="field__label">Duração</span>
              <select className="field__input" value={duracao} onChange={(event) => setDuracao(event.target.value)}>
                {DURACOES.map((minutos) => (
                  <option key={minutos} value={minutos}>
                    {minutos} min
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Tipo</span>
              <select className="field__input" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
              </select>
            </label>
          </div>

          <div className="sheet__linha">
            <label className="field">
              <span className="field__label">Convênio</span>
              <select className="field__input" value={convenioId} onChange={(event) => setConvenioId(event.target.value)}>
                <option value="">Particular</option>
                {convenios.map((convenio) => (
                  <option key={convenio.id} value={convenio.id}>
                    {convenio.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Valor (R$)</span>
              <input
                className="field__input"
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                onBlur={() => setValor((atual) => (paraNumero(atual) === null ? "" : paraTextoValor(paraNumero(atual))))}
                placeholder="0,00"
              />
            </label>
          </div>

          {atendimento && (
            <label className="field">
              <span className="field__label">Status</span>
              <select className="field__input" value={status} onChange={(event) => setStatus(event.target.value)}>
                {STATUS_OPCOES.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {STATUS_LABEL[opcao]}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {erro && (
          <p className="sheet__erro" role="alert">
            {erro}
          </p>
        )}

        <div className="sheet__acoes">
          {atendimento && (
            <button type="button" className="sheet__excluir" onClick={handleExcluir} disabled={salvando}>
              Excluir
            </button>
          )}
          <button type="button" className="sheet__cancelar" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="submit" className="sheet__salvar" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
