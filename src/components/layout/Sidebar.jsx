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

// Agrupado por seção (mesmo formato do menu do sistema financeiro: rótulo de
// grupo em versalete acima de cada bloco de itens).
const GRUPOS = [
  {
    titulo: "Principal",
    itens: [{ rotulo: "Dashboard", icone: IconeDashboard, path: "/hoje" }],
  },
  {
    titulo: "Atendimento",
    itens: [
      { rotulo: "Agenda", icone: IconeAgenda, path: "/agenda", contador: "agendaHoje" },
      { rotulo: "Atendimentos", icone: IconeAtendimentos, path: "/atendimentos" },
      { rotulo: "Prontuários", icone: IconeProntuarios, path: "/prontuarios" },
    ],
  },
  {
    titulo: "Gestão",
    itens: [
      { rotulo: "Pacientes", icone: IconePacientes, path: "/pacientes" },
      { rotulo: "Convênios", icone: IconeConvenios, path: "/convenios" },
      { rotulo: "Financeiro", icone: IconeFinanceiro, path: "/financeiro" },
      { rotulo: "Relatórios", icone: IconeRelatorios, path: "/relatorios" },
    ],
  },
  {
    titulo: "Sistema",
    itens: [
      { rotulo: "Mensagens", icone: IconeMensagens, path: "/mensagens", dot: "mensagensNaoLidas" },
      { rotulo: "Configurações", icone: IconeConfiguracoes, path: "/configuracoes" },
    ],
  },
];

export default function Sidebar({ perfil, agendaHoje = 0, mensagensNaoLidas = false }) {
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
        {GRUPOS.map((grupo) => (
          <div className="sidebar__grupo" key={grupo.titulo}>
            <span className="sidebar__grupo-titulo">{grupo.titulo}</span>
            {grupo.itens.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar__item ${isActive ? "sidebar__item--ativo" : ""}`}
              >
                <item.icone />
                <span>{item.rotulo}</span>
                {item.contador === "agendaHoje" && agendaHoje > 0 && (
                  <span className="sidebar__item-contador">{agendaHoje}</span>
                )}
                {item.dot === "mensagensNaoLidas" && mensagensNaoLidas && (
                  <span className="sidebar__item-dot" aria-label="Mensagens não lidas" />
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar__rodape">
        <div className="sidebar__backup">
          <div className="sidebar__backup-titulo">Backup em dia</div>
          <div className="sidebar__backup-linha">Último: hoje, 06:00 · LGPD ok</div>
        </div>
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
