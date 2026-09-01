import { useEffect, useRef, useState } from "react";
import { apagarBloqueio, atualizarBloqueio, criarBloqueio } from "../../lib/agenda.js";
import { useModalDismiss } from "../../lib/useModalDismiss.js";
import { combinarDataHora, formatarHora, paraISO } from "../../lib/date.js";

export default function BloqueioForm({ aberto, bloqueio, dataPadrao, aoFechar, aoSalvar }) {
  const [data, setData] = useState(paraISO(dataPadrao));
  const [horaInicio, setHoraInicio] = useState("12:00");
  const [horaFim, setHoraFim] = useState("13:00");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    if (bloqueio) {
      setData(paraISO(bloqueio.inicio));
      setHoraInicio(formatarHora(bloqueio.inicio));
      setHoraFim(formatarHora(bloqueio.fim));
      setMotivo(bloqueio.motivo ?? "");
    } else {
      setData(paraISO(dataPadrao));
      setHoraInicio("12:00");
      setHoraFim("13:00");
      setMotivo("");
    }
    setErro("");
  }, [aberto, bloqueio, dataPadrao]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const inicio = combinarDataHora(data, horaInicio);
      const fim = combinarDataHora(data, horaFim);
      if (fim <= inicio) {
        setErro("O horário final precisa ser depois do inicial.");
        setSalvando(false);
        return;
      }

      if (bloqueio) {
        await atualizarBloqueio(bloqueio.id, { inicio, fim, motivo });
      } else {
        await criarBloqueio({ inicio, fim, motivo });
      }

      aoFechar();
      aoSalvar?.();
    } catch (erroSalvar) {
      setErro(erroSalvar.message ?? "Não foi possível salvar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    if (!bloqueio) return;
    if (!window.confirm("Excluir este intervalo? O horário volta a ficar disponível na agenda.")) return;

    setErro("");
    setSalvando(true);
    try {
      await apagarBloqueio(bloqueio.id);
      aoFechar();
      aoSalvar?.();
    } catch (erroExcluir) {
      setErro(erroExcluir.message ?? "Não foi possível excluir agora.");
    } finally {
      setSalvando(false);
    }
  }

  const painelRef = useRef(null);
  useModalDismiss(aberto, aoFechar, painelRef);

  if (!aberto) return null;

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Intervalo">
      <button type="button" className="sheet__backdrop" onClick={aoFechar} aria-label="Fechar" />
      <form className="sheet__painel" ref={painelRef} onSubmit={handleSubmit}>
        <span className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__titulo">{bloqueio ? "Editar intervalo" : "Novo intervalo"}</h2>

        <div className="sheet__campos">
          <label className="field">
            <span className="field__label">Data</span>
            <input className="field__input" type="date" value={data} onChange={(event) => setData(event.target.value)} />
          </label>

          <div className="sheet__linha">
            <label className="field">
              <span className="field__label">Início</span>
              <input
                className="field__input"
                type="time"
                value={horaInicio}
                onChange={(event) => setHoraInicio(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Fim</span>
              <input
                className="field__input"
                type="time"
                value={horaFim}
                onChange={(event) => setHoraFim(event.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span className="field__label">Motivo (opcional)</span>
            <input
              className="field__input"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Almoço, férias…"
            />
          </label>
        </div>

        {erro && (
          <p className="sheet__erro" role="alert">
            {erro}
          </p>
        )}

        <div className="sheet__acoes">
          {bloqueio && (
            <button type="button" className="sheet__excluir" onClick={handleExcluir} disabled={salvando}>
              Excluir
            </button>
          )}
          <button type="button" className="sheet__cancelar" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="submit" className="sheet__salvar" disabled={salvando}>
            {salvando ? "Salvando…" : bloqueio ? "Salvar" : "Bloquear"}
          </button>
        </div>
      </form>
    </div>
  );
}
