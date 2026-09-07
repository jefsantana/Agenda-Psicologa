import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import AbasHorizontais from "../components/ui/AbasHorizontais.jsx";
import AbaHistorico from "../components/prontuario/AbaHistorico.jsx";
import { SecaoObjetivos } from "../components/prontuario/AbaDados.jsx";
import Gad7Grafico from "../components/prontuario/Gad7Grafico.jsx";
import FormularioGad7 from "../components/prontuario/FormularioGad7.jsx";
import {
  buscarAtendimentoParaSessao,
  buscarGad7DoPaciente,
  buscarUltimaEvolucao,
  contarSessoesAnteriores,
  salvarNovaVersaoEvolucao,
} from "../lib/sessao.js";
import { buscarOuCriarProntuario, buscarHistoricoAtendimentos, registrarAuditoria } from "../lib/prontuario.js";
import { buscarPerfil } from "../lib/perfil.js";
import { formatarHora } from "../lib/date.js";
import "./SessaoPage.css";

const TIPO_LABEL = { online: "Online", presencial: "Presencial" };
const ABAS = [
  { id: "evolucao", rotulo: "Evolução" },
  { id: "historico", rotulo: "Histórico" },
  { id: "plano", rotulo: "Plano" },
];
const CHIPS = [
  { id: "queixa", rotulo: "+ Queixa", prefixo: "Queixa: " },
  { id: "intervencao", rotulo: "+ Intervenção", prefixo: "Intervenção: " },
  { id: "tarefa", rotulo: "+ Tarefa de casa", prefixo: "Tarefa de casa: " },
];
const ATRASO_AUTOSAVE_MS = 3000;

export default function SessaoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [atendimento, setAtendimento] = useState(null);
  const [numeroSessao, setNumeroSessao] = useState(null);
  const [prontuario, setProntuario] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [avaliacoesGad7, setAvaliacoesGad7] = useState([]);
  const [gad7Aberto, setGad7Aberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState("evolucao");
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    buscarPerfil().then(setPerfil).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const carregar = useCallback(async () => {
    setErro("");
    setCarregando(true);
    try {
      const atendimentoCarregado = await buscarAtendimentoParaSessao(id);
      const [prontuarioCarregado, historicoCarregado, numeroCarregado, gad7Carregado] = await Promise.all([
        buscarOuCriarProntuario(atendimentoCarregado.paciente_id),
        buscarHistoricoAtendimentos(atendimentoCarregado.paciente_id),
        contarSessoesAnteriores(atendimentoCarregado.paciente_id, atendimentoCarregado.inicio),
        buscarGad7DoPaciente(atendimentoCarregado.paciente_id),
      ]);

      setAtendimento(atendimentoCarregado);
      setProntuario(prontuarioCarregado);
      setHistorico(historicoCarregado);
      setNumeroSessao(numeroCarregado);
      setAvaliacoesGad7(gad7Carregado);

      registrarAuditoria({ acao: "visualizar", entidade: "prontuario", entidadeId: prontuarioCarregado.id });
    } catch (erroCarregar) {
      console.error(erroCarregar);
      setErro("Não foi possível carregar a sessão agora.");
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <AppShell perfil={perfil} title="Sessão">
        <p className="sessao__vazio">Carregando sessão…</p>
      </AppShell>
    );
  }

  if (erro || !atendimento) {
    return (
      <AppShell perfil={perfil} title="Sessão">
        <p className="erro-aviso" role="alert">
          {erro || "Atendimento não encontrado."}
        </p>
      </AppShell>
    );
  }

  const decorridoMs = agora.getTime() - atendimento.inicio.getTime();
  // Cronômetro só faz sentido para uma sessão acontecendo agora — além de 12h
  // (ex.: registrando a evolução de uma sessão passada) ele só polui a tela.
  const dozeHorasMs = 12 * 60 * 60 * 1000;
  const cronometro = decorridoMs >= -dozeHorasMs && decorridoMs <= dozeHorasMs ? formatarCronometro(decorridoMs) : null;

  return (
    <AppShell perfil={perfil} title="Sessão">
      <div className="sessao">
        <div className="sessao__topo">
          <button type="button" className="sessao__voltar" onClick={() => navigate(-1)} aria-label="Voltar">
            ←
          </button>
          <div className="sessao__topo-info">
            <span className="sessao__topo-data">
              {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(atendimento.inicio)},{" "}
              {formatarHora(atendimento.inicio)}
            </span>
          </div>
          {cronometro && <span className="sessao__cronometro">{cronometro}</span>}
        </div>

        <div className="sessao__paciente">
          <span className="sessao__avatar">{iniciaisDoNome(atendimento.paciente)}</span>
          <div>
            <p className="sessao__nome">{atendimento.paciente}</p>
            <span className="sessao__sub">
              {numeroSessao ? `${numeroSessao}ª sessão · ` : ""}
              {atendimento.convenio}
              {atendimento.tipo ? ` · ${TIPO_LABEL[atendimento.tipo] ?? atendimento.tipo}` : ""}
            </span>
          </div>
        </div>

        <AbasHorizontais abas={ABAS} ativa={aba} onMudar={setAba} />

        {aba === "evolucao" && (
          <EditorEvolucao
            atendimentoId={atendimento.id}
            prontuarioId={prontuario.id}
            avaliacoesGad7={avaliacoesGad7}
            onNovaAvaliacao={() => setGad7Aberto(true)}
          />
        )}

        {aba === "historico" && <AbaHistorico historico={historico} />}

        {aba === "plano" && <SecaoObjetivos prontuarioId={prontuario.id} />}

        <p className="sessao__rodape">
          🔒 Registro cifrado e auditado. Acesso apenas por você{perfil?.crp ? ` (CRP ${perfil.crp})` : ""}.
        </p>
      </div>

      <FormularioGad7
        aberto={gad7Aberto}
        atendimentoId={atendimento.id}
        pacienteId={atendimento.paciente_id}
        aoFechar={() => setGad7Aberto(false)}
        aoSalvar={(nova) => setAvaliacoesGad7((atuais) => [...atuais, nova])}
      />
    </AppShell>
  );
}

function EditorEvolucao({ atendimentoId, prontuarioId, avaliacoesGad7, onNovaAvaliacao }) {
  const [texto, setTexto] = useState("");
  const [versaoAtual, setVersaoAtual] = useState(0);
  const [estadoSalvamento, setEstadoSalvamento] = useState("carregando"); // carregando | ocioso | salvando | salvo | erro
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const textareaRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let cancelado = false;
    buscarUltimaEvolucao(atendimentoId)
      .then((ultima) => {
        if (cancelado) return;
        if (ultima) {
          setTexto(ultima.conteudo);
          setVersaoAtual(ultima.versao);
        }
        setEstadoSalvamento("ocioso");
      })
      .catch(() => setEstadoSalvamento("erro"))
      .finally(() => setCarregandoInicial(false));
    return () => {
      cancelado = true;
    };
  }, [atendimentoId]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function agendarAutosave(proximoTexto) {
    clearTimeout(timeoutRef.current);
    setEstadoSalvamento("digitando");
    timeoutRef.current = setTimeout(async () => {
      setEstadoSalvamento("salvando");
      try {
        const salvo = await salvarNovaVersaoEvolucao({
          prontuarioId,
          atendimentoId,
          conteudo: proximoTexto,
          versaoAnterior: versaoAtual,
        });
        setVersaoAtual(salvo.versao);
        setEstadoSalvamento("salvo");
      } catch {
        setEstadoSalvamento("erro");
      }
    }, ATRASO_AUTOSAVE_MS);
  }

  function handleTexto(event) {
    const valor = event.target.value;
    setTexto(valor);
    agendarAutosave(valor);
  }

  function inserirChip(prefixo) {
    const area = textareaRef.current;
    const separador = texto && !texto.endsWith("\n") ? "\n" : "";
    const proximo = `${texto}${separador}${prefixo}`;
    setTexto(proximo);
    agendarAutosave(proximo);
    area?.focus();
  }

  return (
    <section className="sessao-evolucao">
      <div className="sessao-evolucao__cabecalho">
        <h2>Registro de evolução</h2>
        <span className={`sessao-evolucao__estado sessao-evolucao__estado--${estadoSalvamento}`}>
          {rotuloEstado(estadoSalvamento)}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        className="sessao-evolucao__texto"
        value={texto}
        onChange={handleTexto}
        placeholder={carregandoInicial ? "Carregando…" : "Registre aqui o que aconteceu na sessão…"}
        disabled={carregandoInicial}
      />

      <div className="sessao-evolucao__chips">
        {CHIPS.map((chip) => (
          <button key={chip.id} type="button" onClick={() => inserirChip(chip.prefixo)}>
            {chip.rotulo}
          </button>
        ))}
      </div>

      <div className="sessao-evolucao__gad7">
        <div className="sessao-evolucao__gad7-cabecalho">
          <h3>Escala GAD-7 · últimas {avaliacoesGad7.length || 0} sessões</h3>
          <button type="button" onClick={onNovaAvaliacao}>
            + Nova avaliação
          </button>
        </div>
        <Gad7Grafico avaliacoes={avaliacoesGad7} />
      </div>
    </section>
  );
}

function rotuloEstado(estado) {
  switch (estado) {
    case "digitando":
      return "Editando…";
    case "salvando":
      return "Salvando…";
    case "salvo":
      return "Salvo agora";
    case "erro":
      return "Não foi possível salvar";
    default:
      return "";
  }
}

function formatarCronometro(ms) {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function iniciaisDoNome(nome) {
  if (!nome) return "…";
  const partes = nome.trim().split(/\s+/);
  return partes.slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}
