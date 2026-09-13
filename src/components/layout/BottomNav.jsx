import { NavLink } from "react-router-dom";
import { Plus, Menu } from "lucide-react";
import { IconeDashboard, IconeAgenda, IconePacientes } from "./icons.jsx";
import "./BottomNav.css";

// Barra fixa só no celular (a Sidebar assume no desktop, ver BottomNav.css).
// Os 3 destinos mais usados no dia a dia + o atalho de novo atendimento
// ficam sempre à mão, sem precisar abrir o menu "Mais" pra tudo.
export default function BottomNav({ aoNovoAtendimento, aoAbrirMais }) {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <ItemNav to="/hoje" icone={IconeDashboard} rotulo="Início" />
      <ItemNav to="/agenda" icone={IconeAgenda} rotulo="Agenda" />

      <div className="bottom-nav__central">
        <button
          type="button"
          className="bottom-nav__fab"
          onClick={aoNovoAtendimento}
          aria-label="Novo atendimento"
        >
          <Plus />
        </button>
      </div>

      <ItemNav to="/pacientes" icone={IconePacientes} rotulo="Pacientes" />

      <button
        type="button"
        className="bottom-nav__item"
        onClick={aoAbrirMais}
        aria-label="Mais opções"
        aria-haspopup="dialog"
      >
        <Menu size={20} strokeWidth={1.8} />
        <span>Mais</span>
      </button>
    </nav>
  );
}

function ItemNav({ to, icone: Icone, rotulo }) {
  return (
    <NavLink to={to} className={({ isActive }) => `bottom-nav__item ${isActive ? "bottom-nav__item--ativo" : ""}`}>
      <Icone />
      <span>{rotulo}</span>
    </NavLink>
  );
}
