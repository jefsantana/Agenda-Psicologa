import { NavLink } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { IconeAtendimentos, IconeConfiguracoes, IconeConvenios, IconeSair } from "./icons.jsx";
import "./MaisMenu.css";

const ITENS = [
  { rotulo: "Atendimentos", icone: IconeAtendimentos, path: "/atendimentos" },
  { rotulo: "Convênios", icone: IconeConvenios, path: "/convenios" },
  { rotulo: "Configurações", icone: IconeConfiguracoes, path: "/configuracoes" },
];

export default function MaisMenu({ aberto, aoFechar }) {
  if (!aberto) return null;

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Mais opções">
      <button type="button" className="sheet__backdrop" onClick={aoFechar} aria-label="Fechar" />
      <div className="sheet__painel mais-menu">
        <span className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__titulo">Mais opções</h2>

        <nav className="mais-menu__nav">
          {ITENS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={aoFechar}
              className={({ isActive }) => `mais-menu__item ${isActive ? "mais-menu__item--ativo" : ""}`}
            >
              <item.icone />
              <span>{item.rotulo}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="mais-menu__sair" onClick={() => supabase.auth.signOut()}>
          <IconeSair />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
