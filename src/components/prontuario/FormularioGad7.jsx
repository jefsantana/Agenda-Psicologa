import { useRef, useState } from "react";
import { useModalDismiss } from "../../lib/useModalDismiss.js";
import { salvarGad7 } from "../../lib/sessao.js";
import "./FormularioGad7.css";

/**
 * GAD-7 (Generalized Anxiety Disorder 7-item scale) — Spitzer, Kroenke &
 * Williams, 2006. Instrumento de domínio público. Pergunta sobre as
 * últimas 2 semanas; cada item vale de 0 a 3; total de 0 a 21.
 */
const PERGUNTAS = [
  "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)",
  "Não ser capaz de impedir ou controlar as preocupações",
  "Preocupar-se muito com diversas coisas",
  "Dificuldade para relaxar",
  "Ficar tão agitado(a) que se torna difícil permanecer sentado(a)",
  "Ficar facilmente aborrecido(a) ou irritado(a)",
  "Sentir medo, como se algo terrível fosse acontecer",
];

const OPCOES = [
  { valor: 0, rotulo: "Nenhuma vez" },
  { valor: 1, rotulo: "Vários dias" },
  { valor: 2, rotulo: "Mais da metade dos dias" },
  { valor: 3, rotulo: "Quase todos os dias" },
];

export default function FormularioGad7({ aberto, atendimentoId, pacienteId, aoFechar, aoSalvar }) {
  const [respostas, setRespostas] = useState(Array(7).fill(null));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const painelRef = useRef(null);
  useModalDismiss(aberto, fechar, painelRef);

  if (!aberto) return null;

  const completo = respostas.every((valor) => valor !== null);

  function fechar() {
    setRespostas(Array(7).fill(null));
    setErro("");
    aoFechar();
  }

  async function handleSalvar() {
    setSalvando(true);
    setErro("");
    try {
      const salvo = await salvarGad7({ atendimentoId, pacienteId, respostas });
      aoSalvar(salvo);
      fechar();
    } catch (erroSalvar) {
      setErro(erroSalvar.message ?? "Não foi possível salvar a avaliação agora.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Nova avaliação GAD-7">
      <button type="button" className="sheet__backdrop" onClick={fechar} aria-label="Fechar" />
      <div className="sheet__painel gad7-form" ref={painelRef}>
        <span className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__titulo">Escala GAD-7</h2>
        <p className="gad7-form__legenda">Nas últimas 2 semanas, com que frequência você foi incomodado(a) por:</p>

        <ol className="gad7-form__lista">
          {PERGUNTAS.map((pergunta, indice) => (
            <li key={indice} className="gad7-form__item">
              <p className="gad7-form__pergunta">{pergunta}</p>
              <div className="gad7-form__opcoes" role="radiogroup" aria-label={pergunta}>
                {OPCOES.map((opcao) => (
                  <label key={opcao.valor} className="gad7-form__opcao">
                    <input
                      type="radio"
                      name={`gad7-${indice}`}
                      checked={respostas[indice] === opcao.valor}
                      onChange={() =>
                        setRespostas((atual) => atual.map((v, i) => (i === indice ? opcao.valor : v)))
                      }
                    />
                    <span>{opcao.rotulo}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>

        {erro && (
          <p className="gad7-form__erro" role="alert">
            {erro}
          </p>
        )}

        <button type="button" className="gad7-form__salvar" disabled={!completo || salvando} onClick={handleSalvar}>
          {salvando ? "Salvando…" : "Salvar avaliação"}
        </button>
      </div>
    </div>
  );
}
