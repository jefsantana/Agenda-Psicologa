import { useState } from "react";
import { NavLink } from "react-router-dom";
import { IconeAgenda, IconeDashboard, IconeFinanceiro, IconeMais, IconePacientes, IconeProntuarios } from "./icons.jsx";
import MaisMenu from "./MaisMenu.jsx";
import "./TabBar.css";

const ITENS = [
  { rotulo: "Início", icone: IconeDashboard, path: "/hoje" },
  { rotulo: "Agenda", icone: IconeAgenda, path: "/agenda" },
  { rotulo: "Prontuário", icone: IconeProntuarios, path: "/prontuarios" },
  { rotulo: "Pacientes", icone: IconePacientes, path: "/pacientes" },
  { rotulo: "Financeiro", icone: IconeFinanceiro, path: "/financeiro" },
];

export default function TabBar() {
  const [maisAberto, setMaisAberto] = useState(false);

  return (
    <>
      <nav className="tabbar" aria-label="Navegação principal">
        {ITENS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `tabbar__item ${isActive ? "tabbar__item--ativo" : ""}`}
          >
            <span className="tabbar__icon">
              <item.icone />
            </span>
            <span>{item.rotulo}</span>
          </NavLink>
        ))}

        <button type="button" className="tabbar__item" onClick={() => setMaisAberto(true)}>
          <span className="tabbar__icon">
            <IconeMais />
          </span>
          <span>Mais</span>
        </button>
      </nav>

      <MaisMenu aberto={maisAberto} aoFechar={() => setMaisAberto(false)} />
    </>
  );
}
