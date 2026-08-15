import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import StatusBadge from "../components/dashboard/StatusBadge.jsx";
import AtendimentoForm from "../components/agenda/AtendimentoForm.jsx";
import { buscarAtendimentosFiltrados, exportarExcel, exportarPdf } from "../lib/atendimentosLista.js";
import { buscarConvenios } from "../lib/pacientes.js";
import { buscarPerfil } from "../lib/perfil.js";
import { formatarMoeda, inicioDoMes, fimDoMes, paraISO } from "../lib/date.js";
import "./AtendimentosPage.css";

const STATUS_OPCOES = ["agendado", "aguardando", "confirmado", "remarcar", "realizado", "falta", "cancelado"];
const STATUS_LABEL = {
  agendado: "Agendado", aguardando: "Aguardando", confirmado: "Confirmado",
  remarcar: "Remarcar", realizado: "Realizado", falta: "Falta", cancelado: "Cancelado",
};

function formatarDataBr(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export default function AtendimentosPage() {
  const [perfil, setPerfil] = useState(null);
  const [convenios, setConvenios] = useState([]);
  const [dataInicio, setDataInicio] = useState(paraISO(inicioDoMes()));
  const [dataFim, setDataFim] = useState(paraISO(fimDoMes()));
  const [convenioId, setConvenioId] = useState("");
  const [status, setStatus] = useState("");
  const [buscaPaciente, setBuscaPaciente] = useState("");
  const [atendimentos, setAtendimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState(null);
  const [formAberto, setFormAberto] = useState(false);

  const carregar = useCallback(async () => {
    setErro("");
    setCarregando(true);
    try {
      const inicio = dataInicio ? new Date(`${dataInicio}T00:00:00`).toISOString() : null;
      const fim = dataFim ? new Date(`${dataFim}T23:59:59`).toISOString() : null;
      const lista = await buscarAtendimentosFiltrados({ inicio, fim, convenioId, status });
      setAtendimentos(lista);
    } catch (erroCarregar) {
      console.error(erroCarregar);
      setErro("Não foi possível carregar os atendimentos agora.");
    } finally {
      setCarregando(false);
    }
  }, [dataInicio, dataFim, convenioId, status]);

  useEffect(() => {
    buscarPerfil().then(setPerfil).catch(() => {});
    buscarConvenios().then(setConvenios).catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const listaFiltrada = useMemo(() => {
    if (!buscaPaciente.trim()) return atendimentos;
    const termo = buscaPaciente.trim().toLowerCase();
    return atendimentos.filter((item) => item.paciente.toLowerCase().includes(termo));
  }, [atendimentos, buscaPaciente]);

  const total = listaFiltrada.reduce((soma, item) => soma + Number(item.valor ?? 0), 0);

  function handleExportarPdf() {
    const periodo = `${formatarDataBr(dataInicio)} a ${formatarDataBr(dataFim)}`;
    exportarPdf(listaFiltrada, `atendimentos_${dataInicio}_a_${dataFim}.pdf`, periodo);
  }

  function handleExportarExcel() {
    exportarExcel(listaFiltrada, `atendimentos_${dataInicio}_a_${dataFim}.xls`);
  }

  function abrirEdicao(item) {
    setEditando(item);
    setFormAberto(true);
  }

  return (
    <AppShell perfil={perfil} title="Atendimentos" subtitle={`${listaFiltrada.length} no período`}>
      <div className="atd-filtros">
        <label className="field">
          <span className="field__label">De</span>
          <input className="field__input" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Até</span>
          <input className="field__input" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Paciente</span>
          <input
            className="field__input"
            value={buscaPaciente}
            onChange={(e) => setBuscaPaciente(e.target.value)}
            placeholder="Buscar nome…"
          />
        </label>
        <label className="field">
          <span className="field__label">Convênio</span>
          <select className="field__input" value={convenioId} onChange={(e) => setConvenioId(e.target.value)}>
            <option value="">Todos</option>
            {convenios.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Status</span>
          <select className="field__input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {STATUS_OPCOES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
        <div className="atd-filtros__exportar-grupo">
          <button type="button" className="atd-filtros__exportar" onClick={handleExportarPdf} disabled={listaFiltrada.length === 0}>
            Exportar PDF
          </button>
          <button type="button" className="atd-filtros__exportar" onClick={handleExportarExcel} disabled={listaFiltrada.length === 0}>
            Exportar Excel
          </button>
        </div>
      </div>

      {erro && (
        <p className="erro-aviso" role="alert">
          {erro}
        </p>
      )}

      <section className="atd-tabela">
        <div className="atd-tabela__cabecalho">
          <span>Data</span>
          <span>Paciente</span>
          <span>Convênio</span>
          <span>Tipo</span>
          <span>Status</span>
          <span className="atd-tabela__valor">Valor</span>
        </div>

        {carregando ? (
          <p className="atd-tabela__vazio">Carregando…</p>
        ) : listaFiltrada.length === 0 ? (
          <p className="atd-tabela__vazio">Nenhum atendimento encontrado com esses filtros.</p>
        ) : (
          <ul className="atd-tabela__linhas">
            {listaFiltrada.map((item) => (
              <li key={item.id}>
                <button type="button" className="atd-tabela__linha" onClick={() => abrirEdicao(item)}>
                  <span className="atd-tabela__data">
                    {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(item.inicio)}
                    {" · "}
                    {item.inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="atd-tabela__paciente">{item.paciente}</span>
                  <span className="atd-tabela__sub">{item.convenio}</span>
                  <span className="atd-tabela__sub">{item.tipo === "online" ? "Online" : "Presencial"}</span>
                  <StatusBadge status={item.status} />
                  <span className="atd-tabela__valor">{item.valor != null ? formatarMoeda(item.valor) : "—"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!carregando && listaFiltrada.length > 0 && (
          <div className="atd-tabela__total">
            Total do período: <strong>{formatarMoeda(total)}</strong>
          </div>
        )}
      </section>

      <AtendimentoForm
        aberto={formAberto}
        atendimento={editando}
        dataPadrao={editando?.inicio ?? new Date()}
        convenios={convenios}
        aoFechar={() => setFormAberto(false)}
        aoSalvar={carregar}
      />
    </AppShell>
  );
}
