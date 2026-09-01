import { useEffect, useRef, useState } from "react";
import { linkWhatsapp, modelosMensagem, numeroWhatsapp } from "../../lib/whatsapp.js";
import { useModalDismiss } from "../../lib/useModalDismiss.js";
import "./WhatsappSheet.css";

export default function WhatsappSheet({ aberto, paciente, proximoAtendimento, aoFechar }) {
  const modelos = paciente ? modelosMensagem(paciente.nome, proximoAtendimento) : [];
  const [modeloId, setModeloId] = useState(modelos[0]?.id);
  const [mensagem, setMensagem] = useState(modelos[0]?.texto ?? "");

  useEffect(() => {
    if (!aberto || !paciente) return;
    const lista = modelosMensagem(paciente.nome, proximoAtendimento);
    setModeloId(lista[0]?.id);
    setMensagem(lista[0]?.texto ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, paciente?.id]);

  function escolherModelo(modelo) {
    setModeloId(modelo.id);
    setMensagem(modelo.texto);
  }

  const painelRef = useRef(null);
  useModalDismiss(aberto && Boolean(paciente), aoFechar, painelRef);

  if (!aberto || !paciente) return null;

  function formatarTelefoneExibicao(digitos) {
    const semDdi = digitos.startsWith("55") ? digitos.slice(2) : digitos;
    const ddd = semDdi.slice(0, 2);
    const resto = semDdi.slice(2);
    const parte1 = resto.length > 4 ? resto.slice(0, -4) : resto;
    const parte2 = resto.length > 4 ? resto.slice(-4) : "";
    return `(${ddd}) ${parte1}${parte2 ? "-" + parte2 : ""}`;
  }

  const numero = numeroWhatsapp(paciente.telefone);

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Enviar WhatsApp">
      <button type="button" className="sheet__backdrop" onClick={aoFechar} aria-label="Fechar" />
      <div className="sheet__painel" ref={painelRef}>
        <span className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__titulo">WhatsApp — {paciente.nome}</h2>
        {numero && <p className="whatsapp-sheet__telefone">{formatarTelefoneExibicao(numero)}</p>}

        {!numero ? (
          <p className="sheet__erro">
            Este paciente não tem telefone cadastrado. Edite o cadastro para adicionar um número.
          </p>
        ) : (
          <>
            <div className="sheet__campos">
              <div className="field">
                <span className="field__label">Modelo</span>
                <div className="whatsapp-modelos">
                  {modelos.map((modelo) => (
                    <button
                      key={modelo.id}
                      type="button"
                      className={modeloId === modelo.id ? "is-active" : ""}
                      onClick={() => escolherModelo(modelo)}
                    >
                      {modelo.rotulo}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                <span className="field__label">Mensagem</span>
                <textarea
                  className="field__input whatsapp-textarea"
                  value={mensagem}
                  onChange={(event) => setMensagem(event.target.value)}
                />
              </label>
            </div>

            <div className="sheet__acoes">
              <button type="button" className="sheet__cancelar" onClick={aoFechar}>
                Cancelar
              </button>
              <a
                className="sheet__salvar whatsapp-abrir"
                href={linkWhatsapp(paciente.telefone, mensagem)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={aoFechar}
              >
                Abrir WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
