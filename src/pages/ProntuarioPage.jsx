import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import PacienteForm from "../components/pacientes/PacienteForm.jsx";
import AbasProntuario from "../components/prontuario/AbasProntuario.jsx";
import AbaHistorico from "../components/prontuario/AbaHistorico.jsx";
import AbaDados from "../components/prontuario/AbaDados.jsx";
import {
  buscarHistoricoAtendimentos,
  buscarOuCriarProntuario,
  buscarPacienteParaProntuario,
  registrarAuditoria,
} from "../lib/prontuario.js";
import { buscarConvenios, buscarPacientes } from "../lib/pacientes.js";
import { buscarPerfil } from "../lib/perfil.js";
import "./PacientesPage.css";
import "./ProntuarioPage.css";

export default function ProntuarioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pacienteId = searchParams.get("paciente");

  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    buscarPerfil().then(setPerfil).catch(() => {});
  }, []);

  return (
    <AppShell perfil={perfil} title="Prontuário" subtitle="Evolução, registro de sessões e geração de PDF.">
      {pacienteId ? (
        <ProntuarioDoPaciente
          pacienteId={pacienteId}
          perfil={perfil}
          onTrocarPaciente={() => setSearchParams({})}
        />
      ) : (
        <SeletorDePaciente onEscolher={(id) => setSearchParams({ paciente: id })} />
      )}
    </AppShell>
  );
}

function SeletorDePaciente({ onEscolher }) {
  const [busca, setBusca] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => {
      setCarregando(true);
      buscarPacientes(busca)
        .then(setPacientes)
        .catch(() => {})
        .finally(() => setCarregando(false));
    }, 200);
    return () => clearTimeout(id);
  }, [busca]);

  return (
    <section className="prontuario-seletor">
      <label className="pacientes-busca">
        <span className="sr-only">Buscar paciente pelo nome</span>
        <input
          type="search"
          placeholder="Buscar paciente pelo nome…"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />
      </label>

      {carregando ? (
        <p className="prontuario-seletor__vazio">Carregando…</p>
      ) : pacientes.length === 0 ? (
        <p className="prontuario-seletor__vazio">Nenhum paciente encontrado.</p>
      ) : (
        <ul className="prontuario-seletor__lista">
          {pacientes.map((paciente) => (
            <li key={paciente.id}>
              <button type="button" className="prontuario-seletor__item" onClick={() => onEscolher(paciente.id)}>
                <span>{paciente.nome}</span>
                <span className="prontuario-seletor__sub">{paciente.convenio?.nome ?? "Particular"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProntuarioDoPaciente({ pacienteId, perfil, onTrocarPaciente }) {
  const [paciente, setPaciente] = useState(null);
  const [prontuario, setProntuario] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editandoPaciente, setEditandoPaciente] = useState(false);
  const [aba, setAba] = useState("historico");

  const carregar = useCallback(async () => {
    setErro("");
    setCarregando(true);
    try {
      const pacienteCarregado = await buscarPacienteParaProntuario(pacienteId);
      const prontuarioCarregado = await buscarOuCriarProntuario(pacienteId);
      const historicoCarregado = await buscarHistoricoAtendimentos(pacienteId);

      setPaciente(pacienteCarregado);
      setProntuario(prontuarioCarregado);
      setHistorico(historicoCarregado);

      registrarAuditoria({ acao: "visualizar", entidade: "prontuario", entidadeId: prontuarioCarregado.id });
    } catch (erroCarregar) {
      console.error(erroCarregar);
      setErro("Não foi possível carregar o prontuário agora.");
    } finally {
      setCarregando(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    carregar();
    buscarConvenios().then(setConvenios).catch(() => {});
  }, [carregar]);

  useEffect(() => setAba("historico"), [pacienteId]);

  async function handleGerarPdf() {
    // jsPDF só é carregado quando a psicóloga clica em gerar — mantém a tela leve.
    const { gerarPdfProntuario } = await import("../lib/prontuarioPdf.js");
    gerarPdfProntuario({ paciente, prontuario, historico, perfil });
    registrarAuditoria({ acao: "gerar_pdf", entidade: "prontuario", entidadeId: prontuario.id });
  }

  if (carregando) {
    return <p className="prontuario-seletor__vazio">Carregando prontuário…</p>;
  }

  if (erro || !paciente) {
    return <p className="erro-aviso">{erro || "Paciente não encontrado."}</p>;
  }

  return (
    <div className="prontuario-conteudo">
      <div className="prontuario-topo">
        <div className="prontuario-topo__paciente">
          <span className="prontuario-selo">LGPD · sigiloso</span>
          <h2>
            {paciente.nome}
            {historico.length > 0 && (
              <span className="prontuario-topo__sessoes">
                {" "}
                · {historico.length} {historico.length === 1 ? "atendimento" : "atendimentos"}
              </span>
            )}
          </h2>
          <button type="button" className="prontuario-topo__trocar" onClick={onTrocarPaciente}>
            Trocar paciente
          </button>
        </div>
        <button type="button" className="prontuario-gerar-pdf" onClick={handleGerarPdf}>
          Gerar PDF do prontuário
        </button>
      </div>

      <AbasProntuario aba={aba} onMudar={setAba} />

      {aba === "historico" && <AbaHistorico historico={historico} />}

      {aba === "dados" && (
        <AbaDados
          paciente={paciente}
          prontuario={prontuario}
          onEditarPaciente={() => setEditandoPaciente(true)}
          onSalvo={(atualizado) => setProntuario((atual) => ({ ...atual, ...atualizado }))}
        />
      )}

      <PacienteForm
        aberto={editandoPaciente}
        paciente={paciente}
        convenios={convenios}
        aoFechar={() => setEditandoPaciente(false)}
        aoSalvar={carregar}
      />
    </div>
  );
}
