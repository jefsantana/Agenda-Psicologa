import { NavLink } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import {
  IconeAgenda,
  IconeAtendimentos,
  IconeConfiguracoes,
  IconeConvenios,
  IconeDashboard,
  IconeFinanceiro,
  IconeMensagens,
  IconePacientes,
  IconeProntuarios,
  IconeRelatorios,
  IconeSair,
} from "./icons.jsx";
import "./Sidebar.css";

const ITENS = [
  { rotulo: "Dashboard", icone: IconeDashboard, path: "/hoje", implementado: true },
  { rotulo: "Agenda", icone: IconeAgenda, path: "/agenda", implementado: true },
  { rotulo: "Atendimentos", icone: IconeAtendimentos, path: "/atendimentos", implementado: true },
  { rotulo: "Prontuários", icone: IconeProntuarios, path: "/prontuarios", implementado: true },
  { rotulo: "Pacientes", icone: IconePacientes, path: "/pacientes", implementado: true },
  { rotulo: "Convênios", icone: IconeConvenios, path: "/convenios", implementado: true },
  { rotulo: "Financeiro", icone: IconeFinanceiro, path: "/financeiro", implementado: true },
  { rotulo: "Relatórios", icone: IconeRelatorios, path: "/relatorios", implementado: false },
  { rotulo: "Mensagens", icone: IconeMensagens, path: "/mensagens", implementado: false },
  { rotulo: "Configurações", icone: IconeConfiguracoes, path: "/configuracoes", implementado: true },
];

export default function Sidebar({ perfil }) {
  const iniciais = iniciaisDoNome(perfil?.nome);

  return (
    <aside className="sidebar">
      <div className="sidebar__perfil">
        <span className="sidebar__avatar">{iniciais}</span>
        <div className="sidebar__perfil-texto">
          <span className="sidebar__perfil-nome">{perfil?.nome ?? "Carregando…"}</span>
          <span className="sidebar__perfil-crp">
            Psicóloga{perfil?.crp ? ` · CRP ${perfil.crp}` : ""}
          </span>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Navegação principal">
        {ITENS.map((item) =>
          item.implementado ? (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar__item ${isActive ? "sidebar__item--ativo" : ""}`}
            >
              <item.icone />
              <span>{item.rotulo}</span>
            </NavLink>
          ) : (
            <button
              key={item.path}
              type="button"
              className="sidebar__item"
              aria-disabled="true"
              title={`${item.rotulo} — em breve`}
            >
              <item.icone />
              <span>{item.rotulo}</span>
            </button>
          )
        )}
      </nav>

      <div className="sidebar__rodape">
        <button type="button" className="sidebar__sair" onClick={() => supabase.auth.signOut()}>
          <IconeSair />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

function iniciaisDoNome(nome) {
  if (!nome) return "…";
  const partes = nome.trim().split(/\s+/);
  const primeiras = partes.slice(0, 2).map((parte) => parte[0]);
  return primeiras.join("").toUpperCase();
}
