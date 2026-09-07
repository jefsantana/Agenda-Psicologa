import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import { buscarFechamentoMensal } from "../lib/relatorios.js";
import { buscarPerfil } from "../lib/perfil.js";
import { formatarMoeda, formatarMoedaResumo } from "../lib/date.js";
import "./RelatoriosPage.css";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export default function RelatoriosPage() {
  const [perfil, setPerfil] = useState(null);
  const [mes, setMes] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [fechamento, setFechamento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [exportando, setExportando] = useState(false);

  const carregar = useCallback(async () => {
    setErro("");
    setCarregando(true);
    try {
      setFechamento(await buscarFechamentoMensal(mes));
    } catch (erroCarregar) {
      console.error(erroCarregar);
      setErro("Não foi possível carregar o fechamento deste mês agora.");
    } finally {
      setCarregando(false);
    }
  }, [mes]);

  useEffect(() => {
    buscarPerfil().then(setPerfil).catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const mesRotulo = `${MESES[mes.getMonth()]} ${mes.getFullYear()}`;

  async function exportarPdf() {
    setExportando(true);
    try {
      const { gerarRelatorioMensalPdf } = await import("../lib/relatorioPdf.js");
      gerarRelatorioMensalPdf({
        mesRotulo,
        fechamento,
        profissional: { nome: perfil?.nome, crp: perfil?.crp },
      });
    } finally {
      setExportando(false);
    }
  }

  return (
    <AppShell perfil={perfil} title="Relatórios" subtitle="Fechamento do mês e faturamento por convênio.">
      <div className="relatorios-topo">
        <div className="relatorios-mes-nav">
          <button
            type="button"
            onClick={() => setMes((atual) => new Date(atual.getFullYear(), atual.getMonth() - 1, 1))}
            aria-label="Mês anterior"
          >
            ←
          </button>
          <span>{mesRotulo}</span>
          <button
            type="button"
            onClick={() => setMes((atual) => new Date(atual.getFullYear(), atual.getMonth() + 1, 1))}
            aria-label="Próximo mês"
          >
            →
          </button>
        </div>

        <button type="button" className="relatorios-exportar" onClick={exportarPdf} disabled={!fechamento || exportando}>
          {exportando ? "Gerando…" : "Exportar PDF"}
        </button>
      </div>

      {erro && (
        <p className="erro-aviso" role="alert">
          {erro}
        </p>
      )}

      {carregando || !fechamento ? (
        <p className="relatorios-vazio">Carregando…</p>
      ) : (
        <>
          <div className="relatorios-kpis">
            <div className="relatorios-kpi">
              <span className="relatorios-kpi__rotulo">Sessões realizadas</span>
              <p className="relatorios-kpi__valor">{fechamento.sessoes.realizadas}</p>
            </div>
            <div className="relatorios-kpi">
              <span className="relatorios-kpi__rotulo">Faltas / remarcações</span>
              <p className="relatorios-kpi__valor">
                {fechamento.sessoes.faltas}
                <span className="relatorios-kpi__valor-sec"> / {fechamento.sessoes.remarcadas}</span>
              </p>
            </div>
            <div className="relatorios-kpi">
              <span className="relatorios-kpi__rotulo">Faturado no mês</span>
              <p className="relatorios-kpi__valor">{formatarMoedaResumo(fechamento.faturado)}</p>
            </div>
            <div className="relatorios-kpi">
              <span className="relatorios-kpi__rotulo">Recebido no mês</span>
              <p className="relatorios-kpi__valor">{formatarMoedaResumo(fechamento.recebido)}</p>
              <span className="relatorios-kpi__apoio">{formatarMoedaResumo(fechamento.aReceber)} pendente</span>
            </div>
          </div>

          <section className="relatorios-secao">
            <h2>Por convênio</h2>
            {fechamento.porConvenio.length === 0 ? (
              <p className="relatorios-vazio">Nenhuma sessão realizada neste mês.</p>
            ) : (
              <ul className="relatorios-lista">
                {fechamento.porConvenio.map((linha) => (
                  <li key={linha.nome} className="relatorios-linha">
                    <span className="relatorios-linha__nome">{linha.nome}</span>
                    <span className="relatorios-linha__sessoes">
                      {linha.sessoes} sessõe{linha.sessoes === 1 ? "" : "s"}
                    </span>
                    <span className="relatorios-linha__valor">{formatarMoeda(linha.faturado)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="relatorios-secao relatorios-secao--aviso">
            <p>
              O envio automático de relatórios para as operadoras exige integração própria com cada convênio, que
              ainda não existe. O PDF gerado aqui é para conferência e envio manual.
            </p>
          </section>
        </>
      )}
    </AppShell>
  );
}
