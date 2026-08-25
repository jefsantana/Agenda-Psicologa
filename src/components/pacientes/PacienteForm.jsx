import { useEffect, useState } from "react";
import { apagarPaciente, atualizarPaciente, criarPaciente } from "../../lib/pacientes.js";
import AbasHorizontais from "../ui/AbasHorizontais.jsx";
import "./PacienteForm.css";

const ABAS = [
  { id: "basico", rotulo: "Básico" },
  { id: "clinico", rotulo: "Prontuário" },
  { id: "convenio", rotulo: "Convênio" },
];

const VAZIO = {
  nome: "",
  telefone: "",
  email: "",
  nascimento: "",
  cpf: "",
  rg: "",
  sexo: "",
  faixa_etaria: "",
  tipo_atendimento_padrao: "presencial",
  estado_civil: "",
  filiacao: "",
  escolaridade: "",
  profissao: "",
  endereco: "",
  data_inicio_terapia: "",
  convenio_id: "",
  carteirinha: "",
  responsavel: "",
  consentimento: false,
  status: "novo",
};

export default function PacienteForm({ aberto, paciente, convenios, aoFechar, aoSalvar }) {
  const [dados, setDados] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState("basico");

  useEffect(() => {
    if (!aberto) return;
    setAba("basico");
  }, [aberto]);

  useEffect(() => {
    if (paciente) {
      setDados({
        nome: paciente.nome ?? "",
        telefone: paciente.telefone ?? "",
        email: paciente.email ?? "",
        nascimento: paciente.nascimento ?? "",
        cpf: paciente.cpf ?? "",
        rg: paciente.rg ?? "",
        sexo: paciente.sexo ?? "",
        faixa_etaria: paciente.faixa_etaria ?? "",
        tipo_atendimento_padrao: paciente.tipo_atendimento_padrao ?? "presencial",
        estado_civil: paciente.estado_civil ?? "",
        filiacao: paciente.filiacao ?? "",
        escolaridade: paciente.escolaridade ?? "",
        profissao: paciente.profissao ?? "",
        endereco: paciente.endereco ?? "",
        data_inicio_terapia: paciente.data_inicio_terapia ?? "",
        convenio_id: paciente.convenio_id ?? "",
        carteirinha: paciente.carteirinha ?? "",
        responsavel: paciente.responsavel ?? "",
        consentimento: Boolean(paciente.consentimento_em),
        status: paciente.status ?? "novo",
      });
    } else {
      setDados(VAZIO);
    }
    setErro("");
  }, [paciente, aberto]);

  function alterar(campo, valor) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
  }

  async function handleExcluir() {
    if (!paciente) return;
    if (!window.confirm(`Excluir "${paciente.nome}" do cadastro? Essa ação não pode ser desfeita.`)) return;

    setErro("");
    setSalvando(true);
    try {
      await apagarPaciente(paciente.id);
      aoFechar();
      aoSalvar?.();
    } catch (erroExcluir) {
      setErro(erroExcluir.message ?? "Não foi possível excluir agora.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!dados.nome.trim()) {
      setErro("O nome do paciente é obrigatório.");
      setAba("basico");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: dados.nome.trim(),
        telefone: dados.telefone,
        email: dados.email,
        nascimento: dados.nascimento,
        cpf: dados.cpf,
        rg: dados.rg,
        sexo: dados.sexo,
        faixa_etaria: dados.faixa_etaria,
        tipo_atendimento_padrao: dados.tipo_atendimento_padrao,
        estado_civil: dados.estado_civil,
        filiacao: dados.filiacao,
        escolaridade: dados.escolaridade,
        profissao: dados.profissao,
        endereco: dados.endereco,
        data_inicio_terapia: dados.data_inicio_terapia,
        convenio_id: dados.convenio_id || null,
        carteirinha: dados.carteirinha,
        responsavel: dados.responsavel,
        status: dados.status,
        consentimento_em: dados.consentimento
          ? paciente?.consentimento_em ?? new Date().toISOString()
          : null,
      };

      if (paciente) {
        await atualizarPaciente(paciente.id, payload);
      } else {
        await criarPaciente(payload);
      }

      aoFechar();
      aoSalvar?.();
    } catch (erroSalvar) {
      console.error(erroSalvar);
      setErro("Não foi possível salvar. Confira os dados e tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) return null;

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Cadastro de paciente">
      <button type="button" className="sheet__backdrop" onClick={aoFechar} aria-label="Fechar" />
      <form className="sheet__painel" onSubmit={handleSubmit}>
        <span className="sheet__grip" aria-hidden="true" />
        <h2 className="sheet__titulo">{paciente ? "Editar paciente" : "Novo paciente"}</h2>

        <AbasHorizontais abas={ABAS} ativa={aba} onMudar={setAba} />

        <div className="sheet__campos">
          {aba === "basico" && (
            <>
              <label className="field">
                <span className="field__label">Nome *</span>
                <input
                  className="field__input"
                  value={dados.nome}
                  onChange={(event) => alterar("nome", event.target.value)}
                  placeholder="Nome completo"
                />
              </label>

              <div className="sheet__linha">
                <label className="field">
                  <span className="field__label">Telefone/WhatsApp</span>
                  <input
                    className="field__input"
                    type="tel"
                    inputMode="tel"
                    value={dados.telefone}
                    onChange={(event) => alterar("telefone", event.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </label>
                <label className="field">
                  <span className="field__label">Nascimento</span>
                  <input
                    className="field__input"
                    type="date"
                    value={dados.nascimento}
                    onChange={(event) => alterar("nascimento", event.target.value)}
                  />
                </label>
              </div>

              <label className="field">
                <span className="field__label">E-mail</span>
                <input
                  className="field__input"
                  type="email"
                  spellCheck={false}
                  value={dados.email}
                  onChange={(event) => alterar("email", event.target.value)}
                  placeholder="paciente@exemplo.com"
                />
              </label>

              <div className="field">
                <span className="field__label">Tipo de atendimento padrão</span>
                <div className="sheet__toggle">
                  <button
                    type="button"
                    className={dados.tipo_atendimento_padrao === "presencial" ? "is-active" : ""}
                    onClick={() => alterar("tipo_atendimento_padrao", "presencial")}
                  >
                    Presencial
                  </button>
                  <button
                    type="button"
                    className={dados.tipo_atendimento_padrao === "online" ? "is-active" : ""}
                    onClick={() => alterar("tipo_atendimento_padrao", "online")}
                  >
                    Online
                  </button>
                </div>
              </div>
            </>
          )}

          {aba === "clinico" && (
            <>
              <p className="paciente-form__secao">Para o prontuário (opcional agora, agiliza depois)</p>

              <div className="sheet__linha">
                <label className="field">
                  <span className="field__label">Sexo</span>
                  <select className="field__input" value={dados.sexo} onChange={(event) => alterar("sexo", event.target.value)}>
                    <option value="">Não informado</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Faixa etária</span>
                  <select
                    className="field__input"
                    value={dados.faixa_etaria}
                    onChange={(event) => alterar("faixa_etaria", event.target.value)}
                  >
                    <option value="">Não informado</option>
                    <option value="adulto">Adulto</option>
                    <option value="adolescente">Adolescente</option>
                    <option value="crianca">Criança</option>
                  </select>
                </label>
              </div>

              <div className="sheet__linha">
                <label className="field">
                  <span className="field__label">Estado civil</span>
                  <input
                    className="field__input"
                    value={dados.estado_civil}
                    onChange={(event) => alterar("estado_civil", event.target.value)}
                    placeholder="Solteiro(a), casado(a)…"
                  />
                </label>
              </div>

              <label className="field">
                <span className="field__label">Filiação (nome dos pais)</span>
                <input
                  className="field__input"
                  value={dados.filiacao}
                  onChange={(event) => alterar("filiacao", event.target.value)}
                  placeholder="Nome do pai e/ou da mãe"
                />
              </label>

              <div className="sheet__linha">
                <label className="field">
                  <span className="field__label">Escolaridade</span>
                  <input
                    className="field__input"
                    value={dados.escolaridade}
                    onChange={(event) => alterar("escolaridade", event.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Profissão</span>
                  <input
                    className="field__input"
                    value={dados.profissao}
                    onChange={(event) => alterar("profissao", event.target.value)}
                  />
                </label>
              </div>

              <div className="sheet__linha">
                <label className="field">
                  <span className="field__label">RG</span>
                  <input className="field__input" value={dados.rg} onChange={(event) => alterar("rg", event.target.value)} />
                </label>
                <label className="field">
                  <span className="field__label">CPF</span>
                  <input
                    className="field__input"
                    value={dados.cpf}
                    onChange={(event) => alterar("cpf", event.target.value)}
                    placeholder="000.000.000-00"
                  />
                </label>
              </div>

              <label className="field">
                <span className="field__label">Endereço</span>
                <input
                  className="field__input"
                  value={dados.endereco}
                  onChange={(event) => alterar("endereco", event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field__label">Início da terapia</span>
                <input
                  className="field__input"
                  type="date"
                  value={dados.data_inicio_terapia}
                  onChange={(event) => alterar("data_inicio_terapia", event.target.value)}
                />
              </label>
            </>
          )}

          {aba === "convenio" && (
            <>
              <div className="sheet__linha">
                <label className="field">
                  <span className="field__label">Convênio</span>
                  <select
                    className="field__input"
                    value={dados.convenio_id}
                    onChange={(event) => alterar("convenio_id", event.target.value)}
                  >
                    <option value="">Particular</option>
                    {convenios.map((convenio) => (
                      <option key={convenio.id} value={convenio.id}>
                        {convenio.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Carteirinha</span>
                  <input
                    className="field__input"
                    value={dados.carteirinha}
                    onChange={(event) => alterar("carteirinha", event.target.value)}
                  />
                </label>
              </div>

              <label className="field">
                <span className="field__label">Status</span>
                <select
                  className="field__input"
                  value={dados.status}
                  onChange={(event) => alterar("status", event.target.value)}
                >
                  <option value="novo">Novo</option>
                  <option value="ativo">Ativo</option>
                  <option value="pendente">Pendente</option>
                  <option value="inativo">Inativo</option>
                </select>
              </label>

              <label className="field">
                <span className="field__label">Responsável legal (se menor de idade)</span>
                <input
                  className="field__input"
                  value={dados.responsavel}
                  onChange={(event) => alterar("responsavel", event.target.value)}
                  placeholder="Nome do responsável"
                />
              </label>

              <label className="paciente-form__checkbox">
                <input
                  type="checkbox"
                  checked={dados.consentimento}
                  onChange={(event) => alterar("consentimento", event.target.checked)}
                />
                <span>Termo de consentimento assinado</span>
              </label>
            </>
          )}
        </div>

        {erro && (
          <p className="sheet__erro" role="alert">
            {erro}
          </p>
        )}

        <div className="sheet__acoes">
          {paciente && (
            <button type="button" className="sheet__excluir" onClick={handleExcluir} disabled={salvando}>
              Excluir
            </button>
          )}
          <button type="button" className="sheet__cancelar" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="submit" className="sheet__salvar" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
