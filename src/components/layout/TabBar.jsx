import { useState } from "react";
import { Menu, Plus } from "lucide-react";
import MaisMenu from "./MaisMenu.jsx";
import "./TabBar.css";

/**
 * Barra inferior do celular. Só dois botões: o ☰ à esquerda, que abre o menu
 * com todas as telas, e o "+" no centro, sozinho, que abre "Novo atendimento".
 * `aoNovoAtendimento` vem do AppShell.
 */
export default function TabBar({ aoNovoAtendimento }) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <>
      <nav className="tabbar" aria-label="Navegação principal">
        <button
          type="button"
          className="tabbar__menu"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          aria-haspopup="dialog"
          aria-expanded={menuAberto}
        >
          <Menu size={22} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          className="tabbar__acao"
          onClick={aoNovoAtendimento}
          aria-label="Novo atendimento"
          title="Novo atendimento"
        >
          <Plus size={22} strokeWidth={2.4} />
        </button>
      </nav>

      <MaisMenu aberto={menuAberto} aoFechar={() => setMenuAberto(false)} />
    </>
  );
}
