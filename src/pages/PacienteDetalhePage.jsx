import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import PacienteForm from "../components/pacientes/PacienteForm.jsx";
import WhatsappSheet from "../components/pacientes/WhatsappSheet.jsx";
import StatusBadge from "../components/dashboard/StatusBadge.jsx";
import { SecaoObjetivos } from "../components/prontuario/AbaDados.jsx";
import Gad7Grafico from "../components/prontuario/Gad7Grafico.jsx";
import { buscarPacienteParaProntuario, buscarOuCriarProntuario } from "../lib/prontuario.js";
import { buscarResumoPaciente, buscarSessoesRecentes } from "../lib/pacienteDetalhe.js";
import { buscarGad7DoPaciente } from "../lib/sessao.js";
import { buscarConvenios } from "../lib/pacientes.js";
import { buscarPerfil } from "../lib/perfil.js";
import { formatarHora, formatarMoedaResumo } from "../lib/date.js";
import "../components/dashboard/DashboardChips.css";
import "./ProntuarioPage.css";
import "./PacienteDetalhePage.css";

export default function PacienteDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [prontuario, setProntuario] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [sessoesRecentes, setSessoesRecentes] = useState([]);
  const [avaliacoesGad7, setAvaliacoesGad7] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editarAberto, setEditarAberto] = useState(false);
  const [whatsappAberto, setWhatsappAberto] = useState(false);

  const carregar = useCallback(async () => {
    setErro("");
    setCarregando(true);
    try {
      const pacienteCarregado = await buscarPacienteParaProntuario(id);
      const [prontuarioCarregado, resumoCarregado, sessoesCarregadas, gad7Carregado] = await Promise.all([
        buscarOuCriarProntuario(id),
        buscarResumoPaciente(id),
        buscarSessoesRecentes(id),
        buscarGad7DoPaciente(id),
      ]);
      setPaciente(pacienteCarregado);
      setProntuario(prontuarioCarregado);
      setResumo(resumoCarregado);
      setSessoesRecentes(sessoesCarregadas);
      setAvaliacoesGad7(gad7Carregado);
    } catch (erroCarregar) {
      console.error(erroCarregar);
      setErro("Não foi possível carregar a ficha do paciente agora.");
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
    buscarConvenios().then(setConvenios).catch(() => {});
    buscarPerfil().then(setPerfil).catch(() => {});
  }, [carregar]);

  if (carregando) {
    return (
      <AppShell perfil={perfil} title="Pacientes">
        <p className="paciente-detalhe__vazio">Carregando…</p>
      </AppShell>
    );
  }

  if (erro || !paciente) {
    return (
      <AppShell perfil={perfil} title="Pacientes">
        <p className="erro-aviso" role="alert">
          {erro || "Paciente não encontrado."}
        </p>
      </AppShell>
    );
  }

  const idade = calcularIdade(paciente.nascimento);

  return (
    <AppShell perfil={perfil} title="Pacientes">
      <div className="paciente-detalhe">
        <button type="button" className="paciente-detalhe__voltar" onClick={() => navigate("/pacientes")}>
          ← Pacientes
        </button>

        <div className="paciente-detalhe__perfil">
          <span className="paciente-detalhe__avatar">{iniciaisDoNome(paciente.nome)}</span>
          <div>
            <h1 className="paciente-detalhe__nome">{paciente.nome}</h1>
            <span className="paciente-detalhe__sub">
              {idade != null ? `${idade} anos · ` : ""}
              {paciente.convenio?.nome ?? "Particular"}
              {paciente.data_inicio_terapia ? ` · desde ${formatarMesAno(paciente.data_inicio_terapia)}` : ""}
            </span>
          </div>
        </div>

        <div className="paciente-detalhe__acoes">
          <Link to={`/prontuarios?paciente=${paciente.id}`} className="paciente-detalhe__prontuario">
            📄 Prontuário
          </Link>
          {paciente.telefone && (
            <button
              type="button"
              className="paciente-detalhe__icone"
              onClick={() => setWhatsappAberto(true)}
              aria-label="Enviar WhatsApp"
            >
              💬
            </button>
          )}
          <button type="button" className="paciente-detalhe__icone" onClick={() => setEditarAberto(true)} aria-label="Editar cadastro">
            ⋯
          </button>
        </div>

        <div className="paciente-detalhe__chips">
          <div className="chip">
            <span className="chip__rotulo">Sessões</span>
            <p className="chip__valor">{resumo.sessoes}</p>
          </div>
          <div className="chip">
            <span className="chip__rotulo">Faltas</span>
            <p className="chip__valor">{resumo.faltas}</p>
          </div>
          <div className="chip">
            <span className="chip__rotulo">Em aberto</span>
            <p className="chip__valor chip__valor--mono">{formatarMoedaResumo(resumo.emAberto)}</p>
          </div>
        </div>

        <SecaoObjetivos prontuarioId={prontuario.id} />

        <section className="paciente-detalhe__secao">
          <h2>Escala GAD-7 · últimas {avaliacoesGad7.length || 0} sessões</h2>
          <Gad7Grafico avaliacoes={avaliacoesGad7} />
        </section>

        <section className="paciente-detalhe__secao">
          <h2>Sessões recentes</h2>
          {sessoesRecentes.length === 0 ? (
            <p className="paciente-detalhe__vazio">Nenhuma sessão registrada ainda.</p>
          ) : (
            <ul className="paciente-detalhe__sessoes">
              {sessoesRecentes.map((sessao) => (
                <li key={sessao.id}>
                  <Link to={`/atendimentos/${sessao.id}/sessao`} className="paciente-detalhe__sessao-linha">
                    <div className="paciente-detalhe__sessao-data">
                      <span className="paciente-detalhe__sessao-mes">
                        {MESES_ABREV[sessao.inicio.getMonth()]}
                      </span>
                      <span className="paciente-detalhe__sessao-dia">{String(sessao.inicio.getDate()).padStart(2, "0")}</span>
                    </div>
                    <div className="paciente-detalhe__sessao-texto">
                      <p>{sessao.resumoEvolucao ?? `${formatarHora(sessao.inicio)} · sem registro de evolução`}</p>
                      {sessao.gad7 != null && <span className="paciente-detalhe__sessao-gad7">GAD-7: {sessao.gad7}</span>}
                    </div>
                    <StatusBadge status={sessao.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <PacienteForm
        aberto={editarAberto}
        paciente={paciente}
        convenios={convenios}
        aoFechar={() => setEditarAberto(false)}
        aoSalvar={carregar}
      />

      <WhatsappSheet aberto={whatsappAberto} paciente={paciente} proximoAtendimento={null} aoFechar={() => setWhatsappAberto(false)} />
    </AppShell>
  );
}

const MESES_ABREV = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function calcularIdade(nascimentoISO) {
  if (!nascimentoISO) return null;
  const nascimento = new Date(`${nascimentoISO}T00:00:00`);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

function formatarMesAno(dataISO) {
  const data = new Date(`${dataISO}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(data).replace(".", "");
}

function iniciaisDoNome(nome) {
  const partes = nome.trim().split(/\s+/);
  return partes.slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}
