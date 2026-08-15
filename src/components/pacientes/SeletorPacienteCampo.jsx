import { useEffect, useRef, useState } from "react";
import { buscarPacientes, criarPaciente } from "../../lib/pacientes.js";
import "./SeletorPacienteCampo.css";

/**
 * Campo de paciente para formulários de atendimento: busca no cadastro existente
 * em vez de aceitar texto livre, para não criar pacientes duplicados por engano.
 */
export default function SeletorPacienteCampo({ pacienteId, nomePaciente, onMudar, autoFocus }) {
  const [busca, setBusca] = useState(nomePaciente ?? "");
  const [aberto, setAberto] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [criando, setCriando] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setBusca(nomePaciente ?? "");
  }, [nomePaciente]);

  useEffect(() => {
    if (!aberto) {
      setResultados([]);
      return;
    }
    setCarregando(true);
    const termo = busca.trim();
    const id = setTimeout(
      () => {
        buscarPacientes(termo)
          .then((lista) => setResultados(lista.slice(0, termo ? 8 : 10)))
          .catch(() => setResultados([]))
          .finally(() => setCarregando(false));
      },
      termo ? 200 : 0
    );
    return () => clearTimeout(id);
  }, [busca, aberto]);

  useEffect(() => {
    function aoClicarFora(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  function handleChange(event) {
    const valor = event.target.value;
    setBusca(valor);
    setAberto(true);
    if (pacienteId) onMudar({ id: "", nome: valor });
  }

  function handleSelecionar(paciente) {
    setBusca(paciente.nome);
    setAberto(false);
    setResultados([]);
    onMudar(paciente);
  }

  async function handleCriarNovo() {
    const nome = busca.trim();
    if (!nome || criando) return;
    setCriando(true);
    try {
      const novoPaciente = await criarPaciente({ nome, status: "novo" });
      handleSelecionar(novoPaciente);
    } catch {
      setAberto(false);
    } finally {
      setCriando(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") setAberto(false);
  }

  const termoNormalizado = busca.trim().toLowerCase();
  const jaExisteExato = resultados.some((paciente) => paciente.nome.trim().toLowerCase() === termoNormalizado);
  const mostrarDropdown = aberto;
  const semSelecao = !pacienteId && busca.trim().length > 0;

  return (
    <div className="seletor-paciente" ref={containerRef}>
      <label className="field">
        <span className="field__label">Paciente</span>
        <input
          className="field__input"
          value={busca}
          onChange={handleChange}
          onFocus={() => setAberto(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar paciente cadastrado…"
          autoComplete="off"
          role="combobox"
          aria-expanded={mostrarDropdown}
          aria-autocomplete="list"
          autoFocus={autoFocus}
        />
      </label>

      {mostrarDropdown && (
        <ul className="seletor-paciente__lista" role="listbox">
          {carregando && <li className="seletor-paciente__info">Buscando…</li>}
          {!carregando && resultados.length === 0 && (
            <li className="seletor-paciente__info">
              {termoNormalizado ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado ainda."}
            </li>
          )}
          {!carregando &&
            resultados.map((paciente) => (
              <li key={paciente.id} role="option" aria-selected={paciente.id === pacienteId}>
                <button type="button" className="seletor-paciente__item" onClick={() => handleSelecionar(paciente)}>
                  <span>{paciente.nome}</span>
                  <span className="seletor-paciente__sub">{paciente.convenio?.nome ?? "Particular"}</span>
                </button>
              </li>
            ))}
          {!carregando && termoNormalizado && !jaExisteExato && (
            <li>
              <button type="button" className="seletor-paciente__criar" onClick={handleCriarNovo} disabled={criando}>
                {criando ? "Cadastrando…" : `+ Cadastrar novo paciente "${busca.trim()}"`}
              </button>
            </li>
          )}
        </ul>
      )}

      {!mostrarDropdown && semSelecao && (
        <p className="seletor-paciente__aviso">Selecione um paciente da lista ou cadastre um novo.</p>
      )}
    </div>
  );
}
