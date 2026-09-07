import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import AbasHorizontais from "../components/ui/AbasHorizontais.jsx";
import ResumoFinanceiro from "../components/financeiro/ResumoFinanceiro.jsx";
import { baixarPagamento, buscarLancamentos, estornarPagamento, statusLancamento } from "../lib/financeiro.js";
import { buscarPerfil } from "../lib/perfil.js";
import { formatarMoeda, formatarMoedaResumo, paraISO } from "../lib/date.js";
import "../components/dashboard/StatusBadge.css";
import "./FinanceiroPage.css";

const ABAS = [
  { id: "resumo", rotulo: "Resumo" },
  { id: "lancamentos", rotulo: "Lançamentos" },
];

const STATUS_LABEL = { pago: "Pago", pendente: "Pendente", atrasado: "Atrasado" };
const STATUS_CLASSE = { pago: "badge--realizado", pendente: "badge--agendado", atrasado: "badge--falta" };
const FORMAS_PAGAMENTO = ["Pix", "Dinheiro", "Cartão", "Transferência", "Convênio"];

export default function FinanceiroPage() {
  const [perfil, setPerfil] = useState(null);
  const [lancamentos, setLancamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [baixando, setBaixando] = useState(null);
  const [estornando, setEstornando] = useState(null);
  const [formaEscolhida, setFormaEscolhida] = useState(FORMAS_PAGAMENTO[0]);
  const [aba, setAba] = useState("resumo");
  const [mes, setMes] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });

  const carregar = useCallback(async () => {
    setErro("");
    try {
      setLancamentos(await buscarLancamentos());
    } catch (erroCarregar) {
      console.error(erroCarregar);
      setErro("Não foi possível carregar o financeiro agora.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarPerfil().then(setPerfil).catch(() => {});
    carregar();
  }, [carregar]);

  const hojeISO = paraISO(new Date());
  const mesAtual = hojeISO.slice(0, 7);

  const kpis = useMemo(() => {
    let recebidoMes = 0;
    let aReceber = 0;
    let emAtraso = 0;

    for (const lancamento of lancamentos) {
      const status = statusLancamento(lancamento);
      if (status === "pago") {
        if (lancamento.pagoEm?.slice(0, 7) === mesAtual) recebidoMes += lancamento.valor;
      } else if (status === "atrasado") {
        emAtraso += lancamento.valor;
      } else {
        aReceber += lancamento.valor;
      }
    }
    return { recebidoMes, aReceber, emAtraso };
  }, [lancamentos, mesAtual]);

  const listaFiltrada = filtroStatus
    ? lancamentos.filter((l) => statusLancamento(l) === filtroStatus)
    : lancamentos;

  async function confirmarBaixa(id) {
    await baixarPagamento(id, formaEscolhida);
    setBaixando(null);
    carregar();
  }

  async function confirmarEstorno(id) {
    await estornarPagamento(id);
    setEstornando(null);
    carregar();
  }

  async function handleRecibo(lancamento) {
    // jsPDF só carrega ao clicar em "Recibo".
    const { gerarReciboPdf } = await import("../lib/reciboPdf.js");
    gerarReciboPdf({
      paciente: lancamento.paciente,
      convenio: lancamento.convenio,
      valor: lancamento.valor,
      dataAtendimento: lancamento.dataAtendimento,
      pagoEm: lancamento.pagoEm,
      forma: lancamento.forma,
      profissional: { nome: perfil?.nome, crp: perfil?.crp },
    });
  }

  return (
    <AppShell perfil={perfil} title="Financeiro" subtitle="Recebimentos, pendências e recibos.">
      <AbasHorizontais abas={ABAS} ativa={aba} onMudar={setAba} />

      {aba === "resumo" && (
        <ResumoFinanceiro
          lancamentos={lancamentos}
          mes={mes}
          onMudarMes={(delta) => setMes((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1))}
        />
      )}

      {aba === "lancamentos" && (
        <>
      <div className="fin-kpis">
        <div className="fin-kpi">
          <span className="fin-kpi__rotulo">Recebido no mês</span>
          <p className="fin-kpi__valor">{formatarMoedaResumo(kpis.recebidoMes)}</p>
        </div>

        <div className="fin-kpi fin-kpi--secundario">
          <span className="fin-kpi__rotulo">A receber</span>
          <p className="fin-kpi__valor">{formatarMoedaResumo(kpis.aReceber)}</p>
        </div>

        <div className="fin-kpi fin-kpi--alerta">
          <span className="fin-kpi__rotulo">Em atraso</span>
          <p className="fin-kpi__valor">{formatarMoedaResumo(kpis.emAtraso)}</p>
        </div>
      </div>

      <div className="fin-filtros">
        {["", "pendente", "atrasado", "pago"].map((valor) => (
          <button
            key={valor || "todos"}
            type="button"
            className={filtroStatus === valor ? "is-active" : ""}
            onClick={() => setFiltroStatus(valor)}
          >
            {valor ? STATUS_LABEL[valor] : "Todos"}
          </button>
        ))}
      </div>

      {erro && (
        <p className="erro-aviso" role="alert">
          {erro}
        </p>
      )}

      <section className="fin-lista">
        {carregando ? (
          <p className="fin-lista__vazio">Carregando…</p>
        ) : listaFiltrada.length === 0 ? (
          <p className="fin-lista__vazio">Nenhum lançamento encontrado. Atendimentos com valor preenchido aparecem aqui.</p>
        ) : (
          <ul>
            {listaFiltrada.map((lancamento) => {
              const status = statusLancamento(lancamento);
              return (
                <li key={lancamento.id} className="fin-linha">
                  <div className="fin-linha__topo">
                    <span className="fin-linha__paciente">{lancamento.paciente}</span>
                    <span className={`badge ${STATUS_CLASSE[status]}`}>{STATUS_LABEL[status]}</span>
                  </div>
                  <div className="fin-linha__sub">
                    {lancamento.convenio} · vence {formatarDataBr(lancamento.vencimento)}
                  </div>

                  <div className="fin-linha__acoes">
                    <span className="fin-linha__valor">{formatarMoeda(lancamento.valor)}</span>

                    {status === "pago" ? (
                      estornando === lancamento.id ? (
                        <div className="fin-linha__botoes">
                          <button type="button" className="fin-botao fin-botao--estornar" onClick={() => confirmarEstorno(lancamento.id)}>
                            Confirmar estorno
                          </button>
                          <button type="button" className="fin-botao" onClick={() => setEstornando(null)}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="fin-linha__botoes">
                          <button type="button" className="fin-botao fin-botao--recibo" onClick={() => handleRecibo(lancamento)}>
                            Emitir recibo
                          </button>
                          <button type="button" className="fin-botao fin-botao--estornar" onClick={() => setEstornando(lancamento.id)}>
                            Estornar
                          </button>
                        </div>
                      )
                    ) : baixando === lancamento.id ? (
                      <div className="fin-linha__baixa">
                        <select value={formaEscolhida} onChange={(e) => setFormaEscolhida(e.target.value)}>
                          {FORMAS_PAGAMENTO.map((forma) => (
                            <option key={forma} value={forma}>
                              {forma}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="fin-botao fin-botao--confirmar" onClick={() => confirmarBaixa(lancamento.id)}>
                          Confirmar
                        </button>
                        <button type="button" className="fin-botao" onClick={() => setBaixando(null)}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="fin-botao fin-botao--baixar" onClick={() => setBaixando(lancamento.id)}>
                        Dar baixa
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
        </>
      )}
    </AppShell>
  );
}

function formatarDataBr(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}
