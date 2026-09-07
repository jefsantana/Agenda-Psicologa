import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Plus, Search } from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import DashboardKpis from "../components/dashboard/DashboardKpis.jsx";
import DashboardChips from "../components/dashboard/DashboardChips.jsx";
import ProximaSessaoCard from "../components/dashboard/ProximaSessaoCard.jsx";
import AgendaDoDia from "../components/dashboard/AgendaDoDia.jsx";
import DonutConvenios from "../components/dashboard/DonutConvenios.jsx";
import AcoesRapidas from "../components/dashboard/AcoesRapidas.jsx";
import NovoAtendimentoSheet from "../components/dashboard/NovoAtendimentoSheet.jsx";
import AtendimentoForm from "../components/agenda/AtendimentoForm.jsx";
import WhatsappRapido from "../components/dashboard/WhatsappRapido.jsx";
import CalendarioMes from "../components/dashboard/CalendarioMes.jsx";
import ProximosCompromissos from "../components/dashboard/ProximosCompromissos.jsx";
import TarefasPainel from "../components/dashboard/TarefasPainel.jsx";
import PacienteForm from "../components/pacientes/PacienteForm.jsx";
import { buscarAtendimentosEntre, buscarBloqueiosEntre } from "../lib/dashboard.js";
import { contarPendenciasAnteriores } from "../lib/agenda.js";
import { buscarPerfil } from "../lib/perfil.js";
import { buscarTarefas, buscarCompromissosPessoais } from "../lib/tarefas.js";
import { buscarLancamentos } from "../lib/financeiro.js";
import { buscarConvenios } from "../lib/pacientes.js";
import { formatarHora, formatarMinutos, inicioDoMes, fimDoMes, minutosAte, paraISO } from "../lib/date.js";
import "./DashboardPage.css";

const STATUS_RESOLVIDOS = ["realizado", "falta", "remarcar", "cancelado"];

export default function DashboardPage() {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [perfil, setPerfil] = useState(null);
  const [convenios, setConvenios] = useState([]);
  const [itensHoje, setItensHoje] = useState([]);
  const [atendimentosDoMes, setAtendimentosDoMes] = useState([]);
  const [proximosCompromissos, setProximosCompromissos] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [pendenciasAnteriores, setPendenciasAnteriores] = useState({ total: 0, maisAntigo: null });
  const [sheetAberta, setSheetAberta] = useState(false);
  const [whatsappAberto, setWhatsappAberto] = useState(false);
  const [pacienteFormAberto, setPacienteFormAberto] = useState(false);
  const [atendimentoEditando, setAtendimentoEditando] = useState(null);
  const [formEdicaoAberto, setFormEdicaoAberto] = useState(false);

  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [itensDia, setItensDia] = useState([]);
  const [carregandoDia, setCarregandoDia] = useState(true);

  const ehHoje = paraISO(dataSelecionada) === paraISO(new Date());
  const itensDoPainel = ehHoje ? itensHoje : itensDia;

  const carregar = useCallback(async () => {
    setErro("");

    const buscarTudo = async () => {
      const agora = new Date();
      const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      const fimHoje = new Date(inicioHoje.getTime() + 24 * 60 * 60 * 1000);

      const [
        perfilCarregado,
        conveniosCarregados,
        atendimentosHoje,
        bloqueiosHoje,
        atendimentosMes,
        compromissos,
        tarefasCarregadas,
        lancamentosCarregados,
        pendencias,
      ] = await Promise.all([
        buscarPerfil(),
        buscarConvenios(),
        buscarAtendimentosEntre(inicioHoje, fimHoje),
        buscarBloqueiosEntre(inicioHoje, fimHoje),
        buscarAtendimentosEntre(inicioDoMes(agora), fimDoMes(agora)),
        buscarCompromissosPessoais(5),
        buscarTarefas(),
        buscarLancamentos(),
        contarPendenciasAnteriores(inicioHoje).catch(() => ({ total: 0, maisAntigo: null })),
      ]);

      const linhas = [
        ...atendimentosHoje,
        ...bloqueiosHoje.map((bloqueio) => ({ ...bloqueio, tipoLinha: "bloqueio" })),
      ].sort((a, b) => a.inicio - b.inicio);

      setPerfil(perfilCarregado);
      setConvenios(conveniosCarregados);
      setItensHoje(linhas);
      setAtendimentosDoMes(atendimentosMes);
      setProximosCompromissos(compromissos);
      setTarefas(tarefasCarregadas);
      setLancamentos(lancamentosCarregados);
      setPendenciasAnteriores(pendencias);
    };

    try {
      await buscarTudo();
    } catch (primeiroErro) {
      // Logo após o login a sessão pode levar um instante para propagar para o
      // cliente Supabase — em vez de assustar a usuária com um erro nesse
      // momento normal, tenta mais uma vez em silêncio antes de avisar.
      console.warn("Primeira tentativa de carregar o dashboard falhou, tentando novamente:", primeiroErro);
      try {
        await new Promise((resolve) => setTimeout(resolve, 700));
        await buscarTudo();
      } catch (segundoErro) {
        console.error(segundoErro);
        setErro("Não foi possível carregar o dashboard agora. Puxe para atualizar ou tente de novo.");
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarDia = useCallback(async (data) => {
    setCarregandoDia(true);
    try {
      const inicioDia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
      const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);
      const [atendimentos, bloqueios] = await Promise.all([
        buscarAtendimentosEntre(inicioDia, fimDia),
        buscarBloqueiosEntre(inicioDia, fimDia),
      ]);
      const linhas = [
        ...atendimentos,
        ...bloqueios.map((bloqueio) => ({ ...bloqueio, tipoLinha: "bloqueio" })),
      ].sort((a, b) => a.inicio - b.inicio);
      setItensDia(linhas);
    } catch (erroCarregar) {
      console.error(erroCarregar);
    } finally {
      setCarregandoDia(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (ehHoje) return;
    carregarDia(dataSelecionada);
  }, [dataSelecionada, ehHoje, carregarDia]);

  // Atalho "N": abre "Novo atendimento" — só quando nenhum campo de texto está
  // focado e nenhuma folha/modal já está aberta.
  useEffect(() => {
    function aoTeclar(event) {
      if (event.key !== "n" && event.key !== "N") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const alvo = event.target;
      const editavel =
        alvo instanceof HTMLElement &&
        (alvo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName));
      if (editavel) return;
      if (sheetAberta || whatsappAberto || pacienteFormAberto || formEdicaoAberto) return;

      event.preventDefault();
      setSheetAberta(true);
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [sheetAberta, whatsappAberto, pacienteFormAberto, formEdicaoAberto]);

  function aoAtualizarAgenda() {
    carregar();
    if (!ehHoje) carregarDia(dataSelecionada);
  }

  function abrirEdicaoAtendimento(item) {
    setAtendimentoEditando(item);
    setFormEdicaoAberto(true);
  }

  const kpis = calcularKpis(itensHoje, lancamentos);
  const pendentesConfirmacao = itensHoje.filter(
    (item) => item.tipoLinha !== "bloqueio" && item.inicio <= new Date() && !STATUS_RESOLVIDOS.includes(item.status)
  ).length;
  const tarefasAtrasadas = tarefas.filter((t) => t.vence_em && t.vence_em < paraISO(new Date())).length;
  const temAvisosPendentes = pendentesConfirmacao > 0 || pendenciasAnteriores.total > 0;

  const diasComSessao = new Set(atendimentosDoMes.map((item) => paraISO(item.inicio)));
  const diasComPendencia = new Set(
    atendimentosDoMes
      .filter((item) => item.inicio <= new Date() && !STATUS_RESOLVIDOS.includes(item.status))
      .map((item) => paraISO(item.inicio))
  );

  const subtitulo = montarSubtitulo(kpis);

  return (
    <AppShell
      perfil={perfil}
      eyebrow={new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
      title={`Olá, ${primeiroNome(perfil?.nome)}`}
      subtitle={subtitulo}
      acaoPrimaria={
        <div className="dashboard__header-acoes">
          <Link to="/pacientes" className="dashboard__icone-topo" aria-label="Buscar paciente" title="Buscar paciente">
            <Search size={17} strokeWidth={2} />
          </Link>
          <Link to="/agenda" className="dashboard__icone-topo" aria-label="Ver pendências" title="Ver pendências">
            <Bell size={17} strokeWidth={1.9} />
            {temAvisosPendentes && <span className="dashboard__icone-topo-dot" aria-hidden="true" />}
          </Link>
          <button type="button" className="shell__acao-primaria" onClick={() => setSheetAberta(true)}>
            <Plus size={16} strokeWidth={2} />
            Novo atendimento
          </button>
        </div>
      }
    >
      {erro && (
        <p className="erro-aviso" role="alert">
          {erro}
        </p>
      )}

      {!carregando && (pendentesConfirmacao > 0 || pendenciasAnteriores.total > 0) && (
        <div
          className={`dashboard__lembrete ${pendenciasAnteriores.total > 0 ? "" : "dashboard__lembrete--info"}`}
          role={pendenciasAnteriores.total > 0 ? "alert" : "status"}
        >
          {pendentesConfirmacao > 0 && (
            <p>
              {pendentesConfirmacao} atendimento{pendentesConfirmacao === 1 ? "" : "s"} de hoje aguardando confirmação —
              resolva na Agenda do dia, abaixo.
            </p>
          )}
          {pendenciasAnteriores.total > 0 && (
            <p>
              {pendenciasAnteriores.total} atendimento{pendenciasAnteriores.total === 1 ? "" : "s"} de dias anteriores sem
              confirmação
              {pendenciasAnteriores.maisAntigo
                ? ` (desde ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(pendenciasAnteriores.maisAntigo)})`
                : ""}{" "}
              — <Link to="/agenda">resolva na Agenda</Link>.
            </p>
          )}
        </div>
      )}

      {!carregando && kpis.proximo && (
        <ProximaSessaoCard proximo={kpis.proximo} aoAbrirWhatsapp={() => setWhatsappAberto(true)} />
      )}

      <DashboardChips kpis={kpis} tarefasAtrasadas={tarefasAtrasadas} carregando={carregando} />
      <DashboardKpis kpis={kpis} carregando={carregando} />

      <div className="dashboard__grade">
        <div className="dashboard__coluna-principal">
          <AgendaDoDia
            itens={itensDoPainel}
            carregando={ehHoje ? carregando : carregandoDia}
            data={dataSelecionada}
            ehHoje={ehHoje}
            onVoltarHoje={() => setDataSelecionada(new Date())}
            onAtualizado={aoAtualizarAgenda}
            onEditarAtendimento={abrirEdicaoAtendimento}
          />
          <div className="dashboard__par">
            <DonutConvenios atendimentosDoMes={atendimentosDoMes} carregando={carregando} />
            <TarefasPainel tarefas={tarefas} aoCriada={carregar} carregando={carregando} />
          </div>
        </div>

        <div className="dashboard__coluna-direita">
          <CalendarioMes
            selecionado={dataSelecionada}
            onSelecionar={setDataSelecionada}
            marcados={diasComSessao}
            pendentes={diasComPendencia}
          />
          <ProximosCompromissos itens={proximosCompromissos} aoAtualizar={carregar} carregando={carregando} />
          <AcoesRapidas
            aoNovoPaciente={() => setPacienteFormAberto(true)}
            aoWhatsapp={() => setWhatsappAberto(true)}
          />
        </div>
      </div>

      <NovoAtendimentoSheet
        aberto={sheetAberta}
        aoFechar={() => setSheetAberta(false)}
        aoSalvar={aoAtualizarAgenda}
      />

      <WhatsappRapido aberto={whatsappAberto} aoFechar={() => setWhatsappAberto(false)} />

      <AtendimentoForm
        aberto={formEdicaoAberto}
        atendimento={atendimentoEditando}
        dataPadrao={dataSelecionada}
        convenios={convenios}
        aoFechar={() => setFormEdicaoAberto(false)}
        aoSalvar={aoAtualizarAgenda}
      />

      <PacienteForm
        aberto={pacienteFormAberto}
        paciente={null}
        convenios={convenios}
        aoFechar={() => setPacienteFormAberto(false)}
        aoSalvar={carregar}
      />
    </AppShell>
  );
}

function calcularKpis(agendaDoDia, lancamentos) {
  const atendimentosHoje = agendaDoDia.filter((item) => item.tipoLinha !== "bloqueio");
  const naoCancelados = atendimentosHoje.filter((a) => a.status !== "cancelado");
  const total = naoCancelados.length;
  const concluidos = atendimentosHoje.filter((a) => a.status === "realizado").length;

  const faltasRemarcacoes = atendimentosHoje.filter((a) => ["falta", "remarcar"].includes(a.status)).length;
  const remarcacoesAConfirmar = atendimentosHoje.filter((a) => a.status === "remarcar").length;

  const agora = new Date();
  const proximoAtendimento = naoCancelados
    .filter((a) => a.inicio > agora && !["falta", "realizado"].includes(a.status))
    .sort((a, b) => a.inicio - b.inicio)[0];
  const proximo = proximoAtendimento
    ? {
        id: proximoAtendimento.id,
        hora: formatarHora(proximoAtendimento.inicio),
        paciente: proximoAtendimento.paciente,
        tipo: proximoAtendimento.tipo,
        convenio: proximoAtendimento.convenio,
        emMinutos: minutosAte(proximoAtendimento.inicio),
      }
    : null;

  const mesAtual = paraISO(agora).slice(0, 7);
  const mesAnterior = paraISO(new Date(agora.getFullYear(), agora.getMonth() - 1, 1)).slice(0, 7);
  const recebidoMes = somarPagosNoMes(lancamentos, mesAtual);
  const recebidoMesAnterior = somarPagosNoMes(lancamentos, mesAnterior);
  const deltaPct =
    recebidoMesAnterior > 0 ? Math.round(((recebidoMes - recebidoMesAnterior) / recebidoMesAnterior) * 100) : null;
  const aReceber = lancamentos
    .filter((l) => !l.pagoEm && (l.vencimento ?? "").slice(0, 7) <= mesAtual)
    .reduce((soma, l) => soma + l.valor, 0);

  return {
    hoje: { concluidos, total },
    proximo,
    faltas: { total: faltasRemarcacoes, remarcacoesAConfirmar },
    financeiro: { recebidoMes, deltaPct, aReceber },
  };
}

function somarPagosNoMes(lancamentos, mesISO) {
  return lancamentos
    .filter((l) => l.pagoEm?.slice(0, 7) === mesISO)
    .reduce((soma, l) => soma + l.valor, 0);
}

function primeiroNome(nomeCompleto) {
  if (!nomeCompleto) return "…";
  return nomeCompleto.split(" ")[0];
}

/** Subtítulo do header: conteúdo acionável (o que tem hoje, quando é o próximo), não boas-vindas. */
function montarSubtitulo(kpis) {
  const { total } = kpis.hoje;
  if (total === 0) return "Nenhum atendimento hoje.";

  const base = `${total} atendimento${total === 1 ? "" : "s"} hoje`;
  if (!kpis.proximo) return `${base}.`;
  return `${base} · o próximo começa em ${formatarMinutos(kpis.proximo.emMinutos)}.`;
}
