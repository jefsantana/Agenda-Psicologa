import Sidebar from "./Sidebar.jsx";
import TabBar from "./TabBar.jsx";
import "./AppShell.css";

export default function AppShell({ perfil, title, subtitle, children }) {
  const iniciais = iniciaisDoNome(perfil?.nome);

  return (
    <div className="shell">
      <Sidebar perfil={perfil} />

      <div className="shell__main">
        <header className="shell__header">
          <div className="shell__header-left">
            <span className="shell__avatar-mobile">{iniciais}</span>
            <div>
              <h1 className="shell__title">{title}</h1>
              {subtitle && <p className="shell__subtitle">{subtitle}</p>}
            </div>
          </div>
        </header>

        <main className="shell__content">{children}</main>

        <TabBar />
      </div>
    </div>
  );
}

function iniciaisDoNome(nome) {
  if (!nome) return "…";
  const partes = nome.trim().split(/\s+/);
  return partes.slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}
