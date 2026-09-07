import { useState, useEffect } from "react";
import Sidebar from "./Sidebar.jsx";
import TabBar from "./TabBar.jsx";
import NovoAtendimentoSheet from "../dashboard/NovoAtendimentoSheet.jsx";
import "./AppShell.css";

export default function AppShell({ perfil, title, subtitle, eyebrow, acaoPrimaria, children }) {
  const iniciais = iniciaisDoNome(perfil?.nome);
  const [novoAtendimentoAberto, setNovoAtendimentoAberto] = useState(false);

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
            <span className="shell__avatar-mobile">{iniciais}</span>
            <div>
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

        <TabBar aoNovoAtendimento={() => setNovoAtendimentoAberto(true)} />
      </div>

      <NovoAtendimentoSheet
        aberto={novoAtendimentoAberto}
        aoFechar={() => setNovoAtendimentoAberto(false)}
        aoSalvar={() => setNovoAtendimentoAberto(false)}
      />
    </div>
  );
}

function iniciaisDoNome(nome) {
  if (!nome) return "…";
  const partes = nome.trim().split(/\s+/);
  return partes.slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}
