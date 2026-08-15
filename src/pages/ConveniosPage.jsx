import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import ConvenioForm from "../components/convenios/ConvenioForm.jsx";
import { IconeMais } from "../components/dashboard/icons.jsx";
import { buscarTodosConvenios } from "../lib/convenios.js";
import { buscarPerfil } from "../lib/perfil.js";
import { formatarMoeda } from "../lib/date.js";
import "./ConveniosPage.css";

export default function ConveniosPage() {
  const [perfil, setPerfil] = useState(null);
  const [convenios, setConvenios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState(null);

  const carregar = useCallback(async () => {
    setErro("");
    try {
      setConvenios(await buscarTodosConvenios());
    } catch (erroCarregar) {
      console.error(erroCarregar);
      setErro("Não foi possível carregar os convênios agora.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarPerfil().then(setPerfil).catch(() => {});
    carregar();
  }, [carregar]);

  function abrirNovo() {
    setEditando(null);
    setFormAberto(true);
  }

  function abrirEdicao(convenio) {
    setEditando(convenio);
    setFormAberto(true);
  }

  return (
    <AppShell perfil={perfil} title="Convênios" subtitle={`${convenios.length} cadastrados`}>
      <div className="convenios-topo">
        <button type="button" className="convenios-novo" onClick={abrirNovo}>
          <IconeMais />
          Novo convênio
        </button>
      </div>

      {erro && (
        <p className="erro-aviso" role="alert">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="convenios-vazio">Carregando…</p>
      ) : convenios.length === 0 ? (
        <p className="convenios-vazio">Nenhum convênio cadastrado ainda.</p>
      ) : (
        <ul className="convenios-lista">
          {convenios.map((convenio) => (
            <li key={convenio.id}>
              <button type="button" className="convenio-card" onClick={() => abrirEdicao(convenio)}>
                <div className="convenio-card__topo">
                  <span className="convenio-card__nome">{convenio.nome}</span>
                  <span className={`convenio-card__situacao ${convenio.ativo ? "" : "convenio-card__situacao--inativo"}`}>
                    {convenio.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="convenio-card__dados">
                  <span>
                    <strong>{convenio.valor_sessao != null ? formatarMoeda(convenio.valor_sessao) : "—"}</strong> / sessão
                  </span>
                  <span>Repasse em {convenio.prazo_repasse_dias ?? "—"} dias</span>
                  <span>Teto: {convenio.teto_mensal ?? "sem limite"}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConvenioForm aberto={formAberto} convenio={editando} aoFechar={() => setFormAberto(false)} aoSalvar={carregar} />
    </AppShell>
  );
}
