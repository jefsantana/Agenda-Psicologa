import { useEffect, useRef, useState } from "react";
import { apagarConvenio, salvarConvenio } from "../../lib/convenios.js";
import { useModalDismiss } from "../../lib/useModalDismiss.js";
import { paraNumero, paraTextoValor } from "../../lib/numero.js";

export default function ConvenioForm({ aberto, convenio, aoFechar, aoSalvar }) {
  const [nome, setNome] = useState("");
  const [valorSessao, setValorSessao] = useState("");
  const [prazoRepasseDias, setPrazoRepasseDias] = useState("");
  const [tetoMensal, setTetoMensal] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setNome(convenio?.nome ?? "");
    setValorSessao(paraTextoValor(convenio?.valor_sessao));
    setPrazoRepasseDias(convenio?.prazo_repasse_dias ?? "");
    setTetoMensal(convenio?.teto_mensal ?? "");
    setAtivo(convenio?.ativo ?? true);
    setErro("");
  }, [aberto, convenio]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!nome.trim()) {
      setErro("O nome do convênio é obrigatório.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await salvarConvenio({
        id: convenio?.id,
        nome,
        ativo,
        valorSessao: paraNumero(valorSessao) ?? "",
        prazoRepasseDias: prazoRepasseDias === "" ? "" : Number(prazoRepasseDias),
        tetoMensal: tetoMensal === "" ? "" : Number(tetoMensal),
      });
      aoFechar();
      aoSalvar?.();
    } catch (erroSalvar) {
      console.error(erroSalvar);
      setErro("Não foi possível salvar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir() {
    if (!convenio) return;
    if (!window.confirm(`Excluir o convênio "${convenio.nome}"? Essa ação não pode ser desfeita.`)) return;

    setErro("");
    setSalvando(true);
    try {
      await apagarConvenio(convenio.id);
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
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Convênio">
      <button type="button" className="sheet__backdrop" onClick={aoFechar} aria-label="Fechar" />
      <form className="sheet__painel" ref={painelRef} onSubmit={handleSubmit}>
        <span className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__titulo">{convenio ? "Editar convênio" : "Novo convênio"}</h2>

        <div className="sheet__campos">
          <label className="field">
            <span className="field__label">Nome</span>
            <input className="field__input" value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>

          <div className="sheet__linha">
            <label className="field">
              <span className="field__label">Valor por sessão (R$)</span>
              <input
                className="field__input"
                type="text"
                inputMode="decimal"
                value={valorSessao}
                onChange={(e) => setValorSessao(e.target.value)}
                onBlur={() =>
                  setValorSessao((atual) => (paraNumero(atual) === null ? "" : paraTextoValor(paraNumero(atual))))
                }
                placeholder="0,00"
              />
            </label>
            <label className="field">
              <span className="field__label">Prazo de repasse (dias)</span>
              <input
                className="field__input"
                type="number"
                min="0"
                value={prazoRepasseDias}
                onChange={(e) => setPrazoRepasseDias(e.target.value)}
              />
            </label>
          </div>

          <div className="sheet__linha">
            <label className="field">
              <span className="field__label">Teto mensal de sessões</span>
              <input
                className="field__input"
                type="number"
                min="0"
                value={tetoMensal}
                onChange={(e) => setTetoMensal(e.target.value)}
                placeholder="Sem limite"
              />
            </label>
            <label className="field">
              <span className="field__label">Situação</span>
              <select className="field__input" value={ativo ? "1" : "0"} onChange={(e) => setAtivo(e.target.value === "1")}>
                <option value="1">Ativo</option>
                <option value="0">Inativo</option>
              </select>
            </label>
          </div>
        </div>

        {erro && (
          <p className="sheet__erro" role="alert">
            {erro}
          </p>
        )}

        <div className="sheet__acoes">
          {convenio && (
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
