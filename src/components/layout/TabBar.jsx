import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { IconeAgenda, IconeDashboard, IconeFinanceiro, IconePacientes } from "./icons.jsx";
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

/**
 * Barra inferior do celular. 5 células iguais: 2 links à esquerda, o botão
 * central e 2 links à direita — assim o botão central fica no meio real da
 * barra (antes eram 6 células com 2+3, e o "+" caía deslocado à esquerda).
 * O botão central abre a folha "Mais": ali dentro ficam "Novo atendimento"
 * em destaque e as telas secundárias (Prontuários, Convênios, Relatórios…).
 * `aoNovoAtendimento` vem do AppShell e é repassado ao menu.
 */
export default function TabBar({ aoNovoAtendimento }) {
  const [menuAberto, setMenuAberto] = useState(false);

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
            onClick={() => setMenuAberto(true)}
            aria-label="Mais opções e novo atendimento"
            aria-haspopup="dialog"
            aria-expanded={menuAberto}
            title="Mais"
          >
            <Menu size={20} strokeWidth={2.4} />
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
      </nav>

      <MaisMenu
        aberto={menuAberto}
        aoFechar={() => setMenuAberto(false)}
        aoNovoAtendimento={aoNovoAtendimento}
      />
    </>
  );
}
