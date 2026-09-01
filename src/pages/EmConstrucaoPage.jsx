import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import { buscarPerfil } from "../lib/perfil.js";
import "./EmConstrucaoPage.css";

/**
 * Página placeholder para itens de menu que já existem na navegação mas cujo
 * conteúdo ainda não foi construído (Relatórios, Mensagens). Mantém o item do
 * menu como um link normal — em vez de parecer desabilitado — e explica o que
 * esperar quando a pessoa clica.
 */
export default function EmConstrucaoPage({ titulo, descricao }) {
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    buscarPerfil().then(setPerfil).catch(() => {});
  }, []);

  return (
    <AppShell perfil={perfil} title={titulo} subtitle="Em construção">
      <div className="em-construcao">
        <p className="em-construcao__titulo">Esta área ainda está em construção.</p>
        {descricao && <p className="em-construcao__texto">{descricao}</p>}
      </div>
    </AppShell>
  );
}
