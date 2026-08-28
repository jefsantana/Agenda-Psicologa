import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import SeletorDataAgenda from "../components/agenda/SeletorDataAgenda.jsx";
import AtendimentoRow from "../components/agenda/AtendimentoRow.jsx";
import AtendimentoForm from "../components/agenda/AtendimentoForm.jsx";
import BloqueioForm from "../components/agenda/BloqueioForm.jsx";
import {
  buscarAtendimentosPorPeriodo,
  buscarBloqueiosPorPeriodo,
  contarAtendimentosPorDia,
  contarPendenciasAnteriores,
} from "../lib/agenda.js";
import { buscarConvenios } from "../lib/pacientes.js";
import { buscarPerfil } from "../lib/perfil.js";
import { inicioDoMes, fimDoMes, paraISO, dataLonga } from "../lib/date.js";
import "./AgendaPage.css";

export default function AgendaPage() {
  const [perfil, setPerfil] = useState(null);
  const [convenios, setConvenios] = useState([]);
  const [periodo, setPeriodo] = useState(() => {
    const hoje = new Date();
    return { inicio: hoje, fim: hoje };
  });
  const [itensDoPeriodo, setItensDoPeriodo] = useState([]);
  const [diasComAtendimento, setDiasComAtendimento] = useState(new Set());
  const [pendencias, setPendencias] = useState({ total: 0, maisAntigo: null });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [atendimentoEditando, setAtendimentoEditando] = useState(null);
  const [bloqueioAberto, setBloqueioAberto] = useState(false);
  const [bloqueioEditando, setBloqueioEditando] = useState(null);

  const ehIntervalo = paraISO(periodo.inicio) !== paraISO(periodo.fim);

  const carregarPeriodo = useCallback(async (periodoAtual) => {
    setErro("");
    setCarregando(true);
    try {
      const inicioPeriodo = new Date(
        periodoAtual.inicio.getFullYear(),
        periodoAtual.inicio.getMonth(),
        periodoAtual.inicio.getDate()
      );
      const fimPeriodo = new Date(
        periodoAtual.fim.getFullYear(),
        periodoAtual.fim.getMonth(),
        periodoAtual.fim.getDate(),
        23,
        59,
        59,
        999
      );

      const [atendimentos, bloqueios, pendenciasCarregadas] = await Promise.all([
        buscarAtendimentosPorPeriodo(inicioPeriodo, fimPeriodo),
        buscarBloqueiosPorPeriodo(inicioPeriodo, fimPeriodo),
        contarPendenciasAnteriores(inicioPeriodo).catch(() => ({ total: 0, maisAntigo: null })),
      ]);

      const linhas = [
        ...atendimentos,
        ...bloqueios.map((bloqueio) => ({ ...bloqueio, tipoLinha: "bloqueio" })),
      ].sort((a, b) => a.inicio - b.inicio);

      setItensDoPeriodo(linhas);
      setPendencias(pendenciasCarregadas);
    } catch (erroCarregar) {
      console.error(erroCarregar);
      setErro("Não foi possível carregar a agenda agora.");
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarMes = useCallback(async (mesReferencia) => {
    try {
      const contagem = await contarAtendimentosPorDia(inicioDoMes(mesReferencia), fimDoMes(mesReferencia));
      setDiasComAtendimento(contagem);
    } catch (erroCarregar) {
      console.error(erroCarregar);
    }
  }, []);

  useEffect(() => {
    buscarPerfil().then(setPerfil).catch(() => {});
    buscarConvenios().then(setConvenios).catch(() => {});
    carregarMes(new Date());
  }, [carregarMes]);

  useEffect(() => {
    carregarPeriodo(periodo);
  }, [periodo, carregarPeriodo]);

  function abrirEdicao(item) {
    setAtendimentoEditando(item);
    setFormAberto(true);
  }

  function abrirEdicaoIntervalo(bloqueio) {
    setBloqueioEditando(bloqueio);
    setBloqueioAberto(true);
  }

  const grupos = agruparPorDia(itensDoPeriodo);

  return (
    <AppShell perfil={perfil} title="Agenda" subtitle="Gerencie dias, horários e intervalos.">
      <div className="agenda-topo">
        <SeletorDataAgenda periodo={periodo} onMudarPeriodo={setPeriodo} marcados={diasComAtendimento} onMesMudar={carregarMes} />
      </div>

      {erro && (
        <p className="erro-aviso" role="alert">
          {erro}
        </p>
      )}

      {!carregando && pendencias.total > 0 && (
        <p className="agenda-pendencia" role="alert">
          {pendencias.total} atendimento{pendencias.total === 1 ? "" : "s"} de dias anteriores sem confirmação
          {pendencias.maisAntigo
            ? ` (desde ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(pendencias.maisAntigo)})`
            : ""}
          .{" "}
          {pendencias.maisAntigo && (
            <button type="button" onClick={() => setPeriodo({ inicio: pendencias.maisAntigo, fim: pendencias.maisAntigo })}>
              Ir para essa data
            </button>
          )}
        </p>
      )}

      {carregando ? (
        <section className="agenda-lista-painel">
          <p className="agenda-lista-painel__vazio">Carregando…</p>
        </section>
      ) : !ehIntervalo ? (
        <section className="agenda-lista-painel">
          <h2 className="agenda-lista-painel__titulo">{dataLonga(periodo.inicio)}</h2>
          {itensDoPeriodo.length === 0 ? (
            <p className="agenda-lista-painel__vazio">Nada agendado neste dia.</p>
          ) : (
            <ListaAtendimentos
              itens={itensDoPeriodo}
              onClickAtendimento={abrirEdicao}
              onClickBloqueio={abrirEdicaoIntervalo}
              onExcluido={() => carregarPeriodo(periodo)}
            />
          )}
        </section>
      ) : grupos.length === 0 ? (
        <section className="agenda-lista-painel">
          <p className="agenda-lista-painel__vazio">Nada agendado neste intervalo.</p>
        </section>
      ) : (
        grupos.map(({ diaISO, data, itens }) => (
          <section className="agenda-lista-painel" key={diaISO}>
            <h2 className="agenda-lista-painel__titulo">{dataLonga(data)}</h2>
            <ListaAtendimentos
              itens={itens}
              onClickAtendimento={abrirEdicao}
              onClickBloqueio={abrirEdicaoIntervalo}
              onExcluido={() => carregarPeriodo(periodo)}
            />
          </section>
        ))
      )}

      <AtendimentoForm
        aberto={formAberto}
        atendimento={atendimentoEditando}
        dataPadrao={periodo.inicio}
        convenios={convenios}
        aoFechar={() => setFormAberto(false)}
        aoSalvar={() => carregarPeriodo(periodo)}
      />

      <BloqueioForm
        aberto={bloqueioAberto}
        bloqueio={bloqueioEditando}
        dataPadrao={periodo.inicio}
        aoFechar={() => setBloqueioAberto(false)}
        aoSalvar={() => carregarPeriodo(periodo)}
      />
    </AppShell>
  );
}

function ListaAtendimentos({ itens, onClickAtendimento, onClickBloqueio, onExcluido }) {
  return (
    <ul className="agenda-lista-painel__lista">
      {itens.map((item) => (
        <AtendimentoRow
          key={item.id}
          item={item}
          onClick={item.tipoLinha === "bloqueio" ? () => onClickBloqueio(item) : () => onClickAtendimento(item)}
          onExcluido={onExcluido}
        />
      ))}
    </ul>
  );
}

function agruparPorDia(itens) {
  const porDia = new Map();
  for (const item of itens) {
    const diaISO = paraISO(item.inicio);
    if (!porDia.has(diaISO)) porDia.set(diaISO, { diaISO, data: item.inicio, itens: [] });
    porDia.get(diaISO).itens.push(item);
  }
  return Array.from(porDia.values()).sort((a, b) => a.diaISO.localeCompare(b.diaISO));
}
