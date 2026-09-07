import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AbasHorizontais from "../ui/AbasHorizontais.jsx";
import { buscarFilaDeEvolucoes } from "../../lib/prontuario.js";
import { contarSessoesAnteriores } from "../../lib/sessao.js";
import "./WorklistProntuarios.css";

const ABAS = [
  { id: "escrever", rotulo: "A escrever" },
  { id: "assinados", rotulo: "Assinados" },
  { id: "documentos", rotulo: "Documentos" },
];
const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default function WorklistProntuarios({ onBuscarPaciente }) {
  const [aba, setAba] = useState("escrever");
  const [aEscrever, setAEscrever] = useState([]);
  const [assinados, setAssinados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setErro("");
      setCarregando(true);
      try {
        const fila = await buscarFilaDeEvolucoes();
        const comSessoes = await Promise.all(
          fila.aEscrever.map(async (item) => ({
            ...item,
            numeroSessao: await contarSessoesAnteriores(item.pacienteId, item.inicio).catch(() => null),
          }))
        );
        if (cancelado) return;
        setAEscrever(comSessoes);
        setAssinados(fila.assinados);
      } catch (erroCarregar) {
        console.error(erroCarregar);
        if (!cancelado) setErro("Não foi possível carregar a fila de evoluções agora.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const atrasadas = aEscrever.filter((item) => diasDesde(item.inicio) >= 2).length;

  return (
    <div className="worklist-prontuarios">
      <div className="worklist-prontuarios__cabecalho">
        <AbasHorizontais abas={ABAS} ativa={aba} onMudar={setAba} />
        <button type="button" className="worklist-prontuarios__buscar" onClick={onBuscarPaciente}>
          Ver por paciente →
        </button>
      </div>

      {erro && (
        <p className="erro-aviso" role="alert">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="worklist-prontuarios__vazio">Carregando…</p>
      ) : aba === "escrever" ? (
        <>
          {atrasadas > 0 && (
            <p className="worklist-prontuarios__aviso" role="alert">
              {atrasadas} evolu{atrasadas === 1 ? "ção" : "ções"} pendente{atrasadas === 1 ? "" : "s"} há mais de 48h. O CFP
              recomenda registro na própria sessão.
            </p>
          )}

          {aEscrever.length === 0 ? (
            <p className="worklist-prontuarios__vazio">Nenhuma evolução pendente — tudo em dia.</p>
          ) : (
            <ul className="worklist-prontuarios__lista">
              {aEscrever.map((item) => {
                const dias = diasDesde(item.inicio);
                return (
                  <li key={item.id} className="worklist-item">
                    <div className="worklist-item__texto">
                      <div className="worklist-item__cabecalho">
                        <p className="worklist-item__nome">{item.paciente}</p>
                        {dias >= 1 && (
                          <span className="worklist-item__dias">
                            {dias === 1 ? "1 DIA" : `${dias} DIAS`}
                          </span>
                        )}
                      </div>
                      <span className="worklist-item__sub">
                        Sessão de {formatarDataCurta(item.inicio)}
                        {item.numeroSessao ? ` · ${item.numeroSessao}ª` : ""}
                      </span>
                    </div>
                    <Link to={`/atendimentos/${item.id}/sessao`} className="worklist-item__acao">
                      Escrever evolução
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : aba === "assinados" ? (
        assinados.length === 0 ? (
          <p className="worklist-prontuarios__vazio">Nenhuma evolução registrada ainda.</p>
        ) : (
          <ul className="worklist-prontuarios__lista">
            {assinados.map((item) => (
              <li key={item.id} className="worklist-item">
                <div className="worklist-item__texto">
                  <div className="worklist-item__cabecalho">
                    <p className="worklist-item__nome">{item.paciente}</p>
                    <span className="worklist-item__rascunho">Assinado</span>
                  </div>
                  <span className="worklist-item__sub">Sessão de {formatarDataCurta(item.inicio)}</span>
                  {item.resumoEvolucao && <p className="worklist-item__excerto">{item.resumoEvolucao}</p>}
                </div>
                <Link to={`/atendimentos/${item.id}/sessao`} className="worklist-item__acao worklist-item__acao--secundaria">
                  Ver
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="worklist-prontuarios__vazio">
          Emissão de documentos (declaração de comparecimento, relatórios para convênio) ainda não foi construída.
        </p>
      )}
    </div>
  );
}

function diasDesde(data) {
  const inicioDoDia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((inicioHoje.getTime() - inicioDoDia.getTime()) / 86400000);
}

function formatarDataCurta(data) {
  return `${String(data.getDate()).padStart(2, "0")} ${MESES_ABREV[data.getMonth()]}`;
}
