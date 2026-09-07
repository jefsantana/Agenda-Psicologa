import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell.jsx";
import PacienteCard from "../components/pacientes/PacienteCard.jsx";
import PacienteForm from "../components/pacientes/PacienteForm.jsx";
import WhatsappSheet from "../components/pacientes/WhatsappSheet.jsx";
import { IconeMais } from "../components/dashboard/icons.jsx";
import { buscarConvenios, buscarPacientes, buscarProximosAtendimentosPorPaciente } from "../lib/pacientes.js";
import { buscarPerfil } from "../lib/perfil.js";
import "./PacientesPage.css";

const ABAS = [
  { id: "ativos", rotulo: "Ativos", statuses: ["ativo", "novo"] },
  { id: "espera", rotulo: "Em espera", statuses: ["pendente"] },
  { id: "alta", rotulo: "Alta", statuses: ["inativo"] },
];

export default function PacientesPage() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [proximos, setProximos] = useState(new Map());
  const [convenios, setConvenios] = useState([]);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState("ativos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [formAberto, setFormAberto] = useState(false);
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
    setFormAberto(true);
  }

  const abaAtual = ABAS.find((item) => item.id === aba) ?? ABAS[0];
  const pacientesDaAba = pacientes.filter((paciente) => abaAtual.statuses.includes(paciente.status));
  const gruposPorLetra = agruparPorLetra(pacientesDaAba);

  return (
    <AppShell perfil={perfil} title="Pacientes" subtitle={`${pacientesDaAba.length} ${abaAtual.rotulo.toLowerCase()}`}>
      <div className="pacientes-toolbar">
        <label className="pacientes-busca">
          <span className="sr-only">Buscar paciente por nome ou CPF</span>
          <input
            type="search"
            placeholder="Buscar por nome ou CPF"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </label>
        <button type="button" className="pacientes-novo" onClick={abrirNovo}>
          <IconeMais />
          Novo paciente
        </button>
      </div>

      <div className="pacientes-abas" role="tablist" aria-label="Filtrar por status">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={aba === item.id}
            className={aba === item.id ? "pacientes-abas__item--ativo" : "pacientes-abas__item"}
            onClick={() => setAba(item.id)}
          >
            {item.rotulo}
          </button>
        ))}
      </div>

      {erro && (
        <p className="erro-aviso" role="alert">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="pacientes-vazio">Carregando…</p>
      ) : pacientesDaAba.length === 0 ? (
        <p className="pacientes-vazio">
          {busca
            ? "Nenhum paciente encontrado."
            : pacientes.length === 0
              ? 'Nenhum paciente cadastrado ainda. Toque em "Novo paciente".'
              : `Nenhum paciente em "${abaAtual.rotulo}".`}
        </p>
      ) : (
        gruposPorLetra.map(({ letra, itens }) => (
          <div className="pacientes-grupo" key={letra}>
            <h2 className="pacientes-grupo__letra">{letra}</h2>
            <ul className="pacientes-lista">
              {itens.map((paciente) => (
                <PacienteCard
                  key={paciente.id}
                  paciente={paciente}
                  proximoAtendimento={proximos.get(paciente.id)}
                  onClick={() => navigate(`/pacientes/${paciente.id}`)}
                  onWhatsapp={() => setPacienteWhatsapp(paciente)}
                />
              ))}
            </ul>
          </div>
        ))
      )}

      <PacienteForm
        aberto={formAberto}
        paciente={null}
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

/** Agrupa por inicial do nome — a lista já vem ordenada por nome (buscarPacientes). */
function agruparPorLetra(pacientes) {
  const grupos = [];
  for (const paciente of pacientes) {
    const letra = paciente.nome.trim().charAt(0).toUpperCase();
    const grupoAtual = grupos[grupos.length - 1];
    if (grupoAtual?.letra === letra) grupoAtual.itens.push(paciente);
    else grupos.push({ letra, itens: [paciente] });
  }
  return grupos;
}
