import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useModalDismiss } from "../../lib/useModalDismiss.js";
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
import "./MaisMenu.css";

// Todas as telas do app: no celular a barra de baixo tem só o "+", e a
// navegação inteira mora aqui dentro (aberta pelo ☰).
const ITENS = [
  { rotulo: "Início", icone: IconeDashboard, path: "/hoje" },
  { rotulo: "Agenda", icone: IconeAgenda, path: "/agenda" },
  { rotulo: "Pacientes", icone: IconePacientes, path: "/pacientes" },
  { rotulo: "Financeiro", icone: IconeFinanceiro, path: "/financeiro" },
  { rotulo: "Prontuários", icone: IconeProntuarios, path: "/prontuarios" },
  { rotulo: "Atendimentos", icone: IconeAtendimentos, path: "/atendimentos" },
  { rotulo: "Convênios", icone: IconeConvenios, path: "/convenios" },
  { rotulo: "Relatórios", icone: IconeRelatorios, path: "/relatorios" },
  { rotulo: "Mensagens", icone: IconeMensagens, path: "/mensagens" },
  { rotulo: "Configurações", icone: IconeConfiguracoes, path: "/configuracoes" },
];

export default function MaisMenu({ aberto, aoFechar }) {
  const painelRef = useRef(null);
  useModalDismiss(aberto, aoFechar, painelRef);

  if (!aberto) return null;

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Menu de navegação">
      <button type="button" className="sheet__backdrop" onClick={aoFechar} aria-label="Fechar" />
      <div className="sheet__painel mais-menu" ref={painelRef}>
        <span className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__titulo">Menu</h2>

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
