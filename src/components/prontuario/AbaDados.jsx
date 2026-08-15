import { useEffect, useState } from "react";
import { atualizarProntuario } from "../../lib/prontuario.js";
import { alternarObjetivo, buscarObjetivos, criarObjetivo, removerObjetivo } from "../../lib/objetivos.js";
import "./AbaDados.css";

const TIPO_PROFISSIONAL_OPCOES = [
  ["psicologo", "Psicólogo(a)"],
  ["to", "Terapeuta Ocupacional"],
  ["fonoaudiologo", "Fonoaudiólogo(a)"],
  ["fisioterapeuta", "Fisioterapeuta"],
  ["outro", "Outro"],
];

export default function AbaDados({ paciente, prontuario, onEditarPaciente, onSalvo }) {
  return (
    <div className="aba-evolucao">
      <SecaoDadosPaciente paciente={paciente} onEditar={onEditarPaciente} />
      <SecaoObjetivos prontuarioId={prontuario.id} />
      <SecaoClinica prontuario={prontuario} onSalvo={onSalvo} />
    </div>
  );
}

function SecaoObjetivos({ prontuarioId }) {
  const [objetivos, setObjetivos] = useState([]);
  const [novoObjetivo, setNovoObjetivo] = useState("");

  useEffect(() => {
    buscarObjetivos(prontuarioId).then(setObjetivos).catch(() => {});
  }, [prontuarioId]);

  async function handleAdicionarObjetivo(event) {
    event.preventDefault();
    if (!novoObjetivo.trim()) return;
    await criarObjetivo(prontuarioId, novoObjetivo.trim());
    setNovoObjetivo("");
    setObjetivos(await buscarObjetivos(prontuarioId));
  }

  async function handleAlternarObjetivo(objetivo) {
    setObjetivos((atuais) =>
      atuais.map((o) => (o.id === objetivo.id ? { ...o, concluido_em: objetivo.concluido_em ? null : new Date().toISOString() } : o))
    );
    await alternarObjetivo(objetivo.id, !objetivo.concluido_em);
  }

  async function handleRemoverObjetivo(id) {
    setObjetivos((atuais) => atuais.filter((o) => o.id !== id));
    await removerObjetivo(id);
  }

  return (
    <section className="prontuario-secao">
      <h3>Objetivos terapêuticos</h3>
      <ul className="aba-evolucao__objetivos">
        {objetivos.map((objetivo) => (
          <li key={objetivo.id}>
            <label>
              <input
                type="checkbox"
                checked={Boolean(objetivo.concluido_em)}
                onChange={() => handleAlternarObjetivo(objetivo)}
              />
              <span className={objetivo.concluido_em ? "aba-evolucao__objetivo-concluido" : ""}>
                {objetivo.titulo}
              </span>
            </label>
            <button type="button" onClick={() => handleRemoverObjetivo(objetivo.id)} aria-label="Remover objetivo">
              ×
            </button>
          </li>
        ))}
        {objetivos.length === 0 && <p className="prontuario-seletor__vazio">Nenhum objetivo definido ainda.</p>}
      </ul>

      <form className="aba-evolucao__novo-objetivo" onSubmit={handleAdicionarObjetivo}>
        <input
          className="field__input"
          value={novoObjetivo}
          onChange={(e) => setNovoObjetivo(e.target.value)}
          placeholder="Novo objetivo terapêutico…"
        />
        <button type="submit" disabled={!novoObjetivo.trim()}>
          Adicionar
        </button>
      </form>
    </section>
  );
}

function SecaoDadosPaciente({ paciente, onEditar }) {
  const campos = [
    ["Nascimento", formatarDataBr(paciente.nascimento)],
    ["Sexo", paciente.sexo],
    ["Estado civil", paciente.estado_civil],
    ["Filiação", paciente.filiacao],
    ["Escolaridade", paciente.escolaridade],
    ["Profissão", paciente.profissao],
    ["RG", paciente.rg],
    ["CPF", paciente.cpf],
    ["Endereço", paciente.endereco],
    ["Contato", [paciente.telefone, paciente.email].filter(Boolean).join(" · ")],
    ["Início da terapia", formatarDataBr(paciente.data_inicio_terapia)],
  ];

  return (
    <section className="prontuario-secao">
      <div className="prontuario-secao__cabecalho">
        <h3>Dados do paciente</h3>
        <button type="button" className="prontuario-secao__editar" onClick={onEditar}>
          Editar
        </button>
      </div>
      <div className="prontuario-dados-grade">
        {campos.map(([rotulo, valor]) => (
          <div key={rotulo} className="prontuario-dado">
            <span className="prontuario-dado__rotulo">{rotulo}</span>
            <span className="prontuario-dado__valor">{valor || "—"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SecaoClinica({ prontuario, onSalvo }) {
  const [dados, setDados] = useState(paraFormulario(prontuario));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);

  useEffect(() => setDados(paraFormulario(prontuario)), [prontuario]);

  function alterar(campo, valor) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
    setSalvo(false);
  }

  async function handleSalvar() {
    setSalvando(true);
    setErro("");
    try {
      const payload = {
        motivo_consulta: dados.motivo_consulta || null,
        encaminhado_por: dados.encaminhado_por || null,
        avaliacao_objetivo: dados.avaliacao_objetivo || null,
        data_termino_terapia: dados.data_termino_terapia || null,
        motivo_termino: dados.motivo_termino || null,
        tipo_profissional: dados.tipo_profissional,
        nome_profissional: dados.nome_profissional || null,
        numero_conselho: dados.numero_conselho || null,
      };
      await atualizarProntuario(prontuario.id, payload);
      onSalvo(payload);
      setSalvo(true);
    } catch (erroSalvar) {
      console.error(erroSalvar);
      setErro("Não foi possível salvar agora.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="prontuario-secao">
      <h3>Avaliação clínica</h3>

      <label className="field">
        <span className="field__label">Motivo da consulta / Queixa / CID</span>
        <textarea
          className="field__input prontuario-textarea"
          value={dados.motivo_consulta}
          onChange={(event) => alterar("motivo_consulta", event.target.value)}
        />
      </label>

      <label className="field">
        <span className="field__label">Encaminhado por algum profissional? Por qual motivo?</span>
        <textarea
          className="field__input prontuario-textarea prontuario-textarea--curta"
          value={dados.encaminhado_por}
          onChange={(event) => alterar("encaminhado_por", event.target.value)}
        />
      </label>

      <label className="field">
        <span className="field__label">Avaliação e objetivo terapêutico</span>
        <textarea
          className="field__input prontuario-textarea"
          value={dados.avaliacao_objetivo}
          onChange={(event) => alterar("avaliacao_objetivo", event.target.value)}
        />
      </label>

      <div className="prontuario-linha">
        <label className="field">
          <span className="field__label">Data de término da terapia</span>
          <input
            className="field__input"
            type="date"
            value={dados.data_termino_terapia}
            onChange={(event) => alterar("data_termino_terapia", event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Motivo do término</span>
          <select
            className="field__input"
            value={dados.motivo_termino}
            onChange={(event) => alterar("motivo_termino", event.target.value)}
          >
            <option value="">—</option>
            <option value="desistente">Desistente</option>
            <option value="concluido">Concluído</option>
          </select>
        </label>
      </div>

      <p className="prontuario-secao__subtitulo">Profissional responsável pelo atendimento</p>

      <div className="prontuario-linha">
        <label className="field">
          <span className="field__label">Tipo</span>
          <select
            className="field__input"
            value={dados.tipo_profissional}
            onChange={(event) => alterar("tipo_profissional", event.target.value)}
          >
            {TIPO_PROFISSIONAL_OPCOES.map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">Nº do Conselho</span>
          <input
            className="field__input"
            value={dados.numero_conselho}
            onChange={(event) => alterar("numero_conselho", event.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Nome do profissional</span>
        <input
          className="field__input"
          value={dados.nome_profissional}
          onChange={(event) => alterar("nome_profissional", event.target.value)}
        />
      </label>

      {erro && <p className="erro-aviso">{erro}</p>}

      <div className="prontuario-secao__acoes">
        <button type="button" className="prontuario-salvar" onClick={handleSalvar} disabled={salvando}>
          {salvando ? "Salvando…" : salvo ? "Salvo ✓" : "Salvar avaliação"}
        </button>
      </div>
    </section>
  );
}

function paraFormulario(prontuario) {
  return {
    motivo_consulta: prontuario.motivo_consulta ?? "",
    encaminhado_por: prontuario.encaminhado_por ?? "",
    avaliacao_objetivo: prontuario.avaliacao_objetivo ?? "",
    data_termino_terapia: prontuario.data_termino_terapia ?? "",
    motivo_termino: prontuario.motivo_termino ?? "",
    tipo_profissional: prontuario.tipo_profissional ?? "psicologo",
    nome_profissional: prontuario.nome_profissional ?? "",
    numero_conselho: prontuario.numero_conselho ?? "",
  };
}

function formatarDataBr(iso) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}
