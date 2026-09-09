import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import MaisMenu from "./MaisMenu.jsx";
import NovoAtendimentoSheet from "../dashboard/NovoAtendimentoSheet.jsx";
import "./AppShell.css";

export default function AppShell({ perfil, title, subtitle, eyebrow, acaoPrimaria, children }) {
  const [novoAtendimentoAberto, setNovoAtendimentoAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    document.title = title ? `${title} · Espaço Raquel Fróis` : "Espaço Raquel Fróis";
    return () => {
      document.title = "Espaço Raquel Fróis";
    };
  }, [title]);

  return (
    <div className="shell">
      <a href="#conteudo-principal" className="shell__skip-link">
        Pular para o conteúdo
      </a>

      <Sidebar perfil={perfil} />

      <div className="shell__main">
        <header className="shell__header">
          <div className="shell__header-left">
            <button
              type="button"
              className="shell__menu-botao"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              aria-haspopup="dialog"
              aria-expanded={menuAberto}
            >
              <Menu size={22} strokeWidth={2.2} />
            </button>
            <div className="shell__header-texto">
              {eyebrow && <span className="shell__eyebrow">{eyebrow}</span>}
              <h1 className="shell__title">{title}</h1>
              {subtitle && <p className="shell__subtitle">{subtitle}</p>}
            </div>
          </div>
          {acaoPrimaria && <div className="shell__header-right">{acaoPrimaria}</div>}
        </header>

        <main className="shell__content" id="conteudo-principal" tabIndex={-1}>
          {children}
        </main>
      </div>

      <MaisMenu
        aberto={menuAberto}
        aoFechar={() => setMenuAberto(false)}
        aoNovoAtendimento={() => setNovoAtendimentoAberto(true)}
      />

      <NovoAtendimentoSheet
        aberto={novoAtendimentoAberto}
        aoFechar={() => setNovoAtendimentoAberto(false)}
        aoSalvar={() => setNovoAtendimentoAberto(false)}
      />
    </div>
  );
}
