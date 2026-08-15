import { useEffect, useRef, useState } from "react";
import { IconeMaisOpcoes } from "../dashboard/icons.jsx";
import "./MenuAcoesLinha.css";

/** Menu "⋮" de uma linha de atendimento: editar ou excluir sem precisar abrir o formulário inteiro. */
export default function MenuAcoesLinha({ onEditar, onExcluir }) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function aoClicarFora(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  return (
    <div className="menu-acoes-linha" ref={containerRef}>
      <button
        type="button"
        className="menu-acoes-linha__botao"
        aria-label="Mais opções"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={(event) => {
          event.stopPropagation();
          setAberto((atual) => !atual);
        }}
      >
        <IconeMaisOpcoes />
      </button>

      {aberto && (
        <div className="menu-acoes-linha__menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={(event) => {
              event.stopPropagation();
              setAberto(false);
              onEditar();
            }}
          >
            Editar
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu-acoes-linha__excluir"
            onClick={(event) => {
              event.stopPropagation();
              setAberto(false);
              onExcluir();
            }}
          >
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
