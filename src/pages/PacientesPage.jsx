import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import PacienteCard from "../components/pacientes/PacienteCard.jsx";
import PacienteForm from "../components/pacientes/PacienteForm.jsx";
import WhatsappSheet from "../components/pacientes/WhatsappSheet.jsx";
import { IconeMais } from "../components/dashboard/icons.jsx";
import { buscarConvenios, buscarPacientes, buscarProximosAtendimentosPorPaciente } from "../lib/pacientes.js";
import { buscarPerfil } from "../lib/perfil.js";
import "./PacientesPage.css";

export default function PacientesPage() {
  const [perfil, setPerfil] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [proximos, setProximos] = useState(new Map());
  const [convenios, setConvenios] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [pacienteWhatsapp, setPacienteWhatsapp] = useState(null);

  const carregar = useCallback(async (termoBusca) => {
    setErro("");
    try {
      const [listaPacientes, proximosCarregados] = await Promise.all([
        buscarPacientes(termoBusca),
        buscarProximosAtendimentosPorPaciente(),
      ]);
      setPacientes(listaPacientes);
      setProximos(proximosCarregados);
    } catch (erroCarregar) {
      console.error(erroCarregar);
      setErro("Não foi possível carregar os pacientes agora.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarPerfil().then(setPerfil).catch(() => {});
    buscarConvenios().then(setConvenios).catch(() => {});
  }, []);

  useEffect(() => {
    const id = setTimeout(() => carregar(busca), 250); // debounce da busca
    return () => clearTimeout(id);
  }, [busca, carregar]);

  function abrirNovo() {
    setPacienteEditando(null);
    setFormAberto(true);
  }

  function abrirEdicao(paciente) {
    setPacienteEditando(paciente);
    setFormAberto(true);
  }

  return (
    <AppShell perfil={perfil} title="Pacientes" subtitle={`${pacientes.length} cadastrados`}>
      <div className="pacientes-toolbar">
        <label className="pacientes-busca">
          <span className="sr-only">Buscar paciente por nome</span>
          <input
            type="search"
            placeholder="Buscar por nome…"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </label>
        <button type="button" className="pacientes-novo" onClick={abrirNovo}>
          <IconeMais />
          Novo paciente
        </button>
      </div>

      {erro && (
        <p className="erro-aviso" role="alert">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="pacientes-vazio">Carregando…</p>
      ) : pacientes.length === 0 ? (
        <p className="pacientes-vazio">
          {busca ? "Nenhum paciente encontrado." : 'Nenhum paciente cadastrado ainda. Toque em "Novo paciente".'}
        </p>
      ) : (
        <ul className="pacientes-lista">
          {pacientes.map((paciente) => (
            <PacienteCard
              key={paciente.id}
              paciente={paciente}
              proximoAtendimento={proximos.get(paciente.id)}
              onClick={() => abrirEdicao(paciente)}
              onWhatsapp={() => setPacienteWhatsapp(paciente)}
            />
          ))}
        </ul>
      )}

      <PacienteForm
        aberto={formAberto}
        paciente={pacienteEditando}
        convenios={convenios}
        aoFechar={() => setFormAberto(false)}
        aoSalvar={() => carregar(busca)}
      />

      <WhatsappSheet
        aberto={Boolean(pacienteWhatsapp)}
        paciente={pacienteWhatsapp}
        proximoAtendimento={pacienteWhatsapp ? proximos.get(pacienteWhatsapp.id) : null}
        aoFechar={() => setPacienteWhatsapp(null)}
      />
    </AppShell>
  );
}
