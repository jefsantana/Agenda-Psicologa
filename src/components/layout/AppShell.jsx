import { useState, useEffect } from "react";
import Sidebar from "./Sidebar.jsx";
import BottomNav from "./BottomNav.jsx";
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

      <BottomNav
        aoNovoAtendimento={() => setNovoAtendimentoAberto(true)}
        aoAbrirMais={() => setMenuAberto(true)}
      />

      <MaisMenu aberto={menuAberto} aoFechar={() => setMenuAberto(false)} />

      <NovoAtendimentoSheet
        aberto={novoAtendimentoAberto}
        aoFechar={() => setNovoAtendimentoAberto(false)}
        aoSalvar={() => setNovoAtendimentoAberto(false)}
      />
    </div>
  );
}
