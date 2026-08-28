import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import KpiCard from "../components/dashboard/KpiCard.jsx";
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
import { IconeAlerta, IconeChecklist, IconeCifrao, IconeRelogio } from "../components/dashboard/icons.jsx";
import { buscarAtendimentosEntre, buscarBloqueiosEntre } from "../lib/dashboard.js";
import { contarPendenciasAnteriores } from "../lib/agenda.js";
import { buscarPerfil } from "../lib/perfil.js";
import { buscarTarefas, buscarCompromissosPessoais } from "../lib/tarefas.js";
import { buscarLancamentos } from "../lib/financeiro.js";
import { buscarConvenios } from "../lib/pacientes.js";
import { formatarMoedaResumo, inicioDoMes, fimDoMes, paraISO } from "../lib/date.js";
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
  const [lancamentosDoMes, setLancamentosDoMes] = useState([]);
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
        lancamentos,
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
      setLancamentosDoMes(lancamentos.filter((l) => l.pagoEm?.slice(0, 7) === mesAtualISO()));
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

  function aoAtualizarAgenda() {
    carregar();
    if (!ehHoje) carregarDia(dataSelecionada);
  }

  function abrirEdicaoAtendimento(item) {
    setAtendimentoEditando(item);
    setFormEdicaoAberto(true);
  }

  const kpis = calcularKpis(itensHoje, lancamentosDoMes);
  const pendentesConfirmacao = itensHoje.filter(
    (item) => item.tipoLinha !== "bloqueio" && item.inicio <= new Date() && !STATUS_RESOLVIDOS.includes(item.status)
  ).length;

  return (
    <AppShell
      perfil={perfil}
      title={`Olá, ${primeiroNome(perfil?.nome)}`}
      subtitle="Aqui está o resumo da sua clínica hoje."
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

      <div className="dashboard__kpis">
        <KpiCard
          cor="primary"
          icone={<IconeChecklist />}
          rotulo="Atendimentos hoje"
          valor={carregando ? "…" : kpis.confirmadosHoje}
          legenda={carregando ? "" : `de ${kpis.totalHoje} agendados`}
        />
        <KpiCard
          cor="success"
          icone={<IconeRelogio />}
          rotulo="Próximos atendimentos"
          valor={carregando ? "…" : kpis.proximasDuasHoras}
          legenda="nas próximas 2 horas"
        />
        <KpiCard
          cor="warning"
          icone={<IconeAlerta />}
          rotulo="Faltas e remarcações"
          valor={carregando ? "…" : kpis.faltasRemarcacoes}
          legenda="hoje"
        />
        <KpiCard
          cor="info"
          icone={<IconeCifrao />}
          rotulo="Recebimentos (mês)"
          valor={carregando ? "…" : formatarMoedaResumo(kpis.recebidoMes)}
          legenda="pago até agora"
        />
      </div>

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
          <DonutConvenios atendimentosDoMes={atendimentosDoMes} />
          <AcoesRapidas
            aoNovoAtendimento={() => setSheetAberta(true)}
            aoNovoPaciente={() => setPacienteFormAberto(true)}
            aoWhatsapp={() => setWhatsappAberto(true)}
          />
        </div>

        <div className="dashboard__coluna-direita">
          <CalendarioMes selecionado={dataSelecionada} onSelecionar={setDataSelecionada} />
          <ProximosCompromissos itens={proximosCompromissos} aoAtualizar={carregar} />
          <TarefasPainel tarefas={tarefas} aoCriada={carregar} />
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

function mesAtualISO() {
  return paraISO(new Date()).slice(0, 7);
}

function calcularKpis(agendaDoDia, lancamentosDoMes) {
  const atendimentosHoje = agendaDoDia.filter((item) => item.tipoLinha !== "bloqueio");
  const totalHoje = atendimentosHoje.filter((a) => a.status !== "cancelado").length;
  const confirmadosHoje = atendimentosHoje.filter((a) =>
    ["confirmado", "realizado"].includes(a.status)
  ).length;
  const faltasRemarcacoes = atendimentosHoje.filter((a) =>
    ["falta", "remarcar"].includes(a.status)
  ).length;

  const agora = Date.now();
  const daquiA2h = agora + 2 * 60 * 60 * 1000;
  const proximasDuasHoras = atendimentosHoje.filter((a) => {
    const t = a.inicio.getTime();
    return t >= agora && t <= daquiA2h && !["cancelado", "falta"].includes(a.status);
  }).length;

  const recebidoMes = lancamentosDoMes.reduce((soma, l) => soma + l.valor, 0);

  return { totalHoje, confirmadosHoje, faltasRemarcacoes, proximasDuasHoras, recebidoMes };
}

function primeiroNome(nomeCompleto) {
  if (!nomeCompleto) return "…";
  return nomeCompleto.split(" ")[0];
}
