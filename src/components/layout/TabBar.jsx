import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { IconeAgenda, IconeDashboard, IconeFinanceiro, IconeMais, IconePacientes } from "./icons.jsx";
import MaisMenu from "./MaisMenu.jsx";
import "./TabBar.css";

const ITENS_ESQUERDA = [
  { rotulo: "Início", icone: IconeDashboard, path: "/hoje" },
  { rotulo: "Agenda", icone: IconeAgenda, path: "/agenda" },
];

const ITENS_DIREITA = [
  { rotulo: "Pacientes", icone: IconePacientes, path: "/pacientes" },
  { rotulo: "Financeiro", icone: IconeFinanceiro, path: "/financeiro" },
];

/** `aoNovoAtendimento` abre a folha de novo atendimento (montada em AppShell). */
export default function TabBar({ aoNovoAtendimento }) {
  const [maisAberto, setMaisAberto] = useState(false);

  return (
    <>
      <nav className="tabbar" aria-label="Navegação principal">
        {ITENS_ESQUERDA.map((item) => (
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

        <div className="tabbar__acao-slot">
          <button
            type="button"
            className="tabbar__acao"
            onClick={aoNovoAtendimento}
            aria-label="Novo atendimento"
            title="Novo atendimento"
          >
            <Plus size={20} strokeWidth={2.4} />
          </button>
        </div>

        {ITENS_DIREITA.map((item) => (
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
