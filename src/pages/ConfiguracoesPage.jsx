import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import { buscarPerfil, salvarPerfil } from "../lib/perfil.js";
import { buscarHorariosSemana, salvarHorarioDia } from "../lib/configuracoes.js";
import {
  buscarFeriadosPersonalizados,
  criarFeriado,
  apagarFeriado,
  sincronizarFeriados,
} from "../lib/feriadosRemotos.js";
import {
  ACENTOS,
  MODOS,
  PALETAS,
  definirAcento,
  definirModo,
  definirPaleta,
  obterAcento,
  obterModo,
  obterPaleta,
} from "../lib/tema.js";
import { supabase } from "../lib/supabaseClient.js";
import "./ConfiguracoesPage.css";

const NOMES_DIA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function ConfiguracoesPage() {
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarPerfil()
      .then(setPerfil)
      .finally(() => setCarregando(false));
  }, []);

  return (
    <AppShell perfil={perfil} title="Configurações" subtitle="Perfil, aparência, horários e segurança.">
      {carregando ? (
        <p className="config-vazio">Carregando…</p>
      ) : (
        <>
          <SecaoPerfil perfil={perfil} onSalvo={setPerfil} />
          <SecaoAparencia />
          <SecaoHorarios />
          <SecaoFeriados />
          <SecaoSenha />
        </>
      )}
    </AppShell>
  );
}

function SecaoPerfil({ perfil, onSalvo }) {
  const [nome, setNome] = useState(perfil?.nome ?? "");
  const [crp, setCrp] = useState(perfil?.crp ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);

  async function handleSalvar(event) {
    event.preventDefault();
    if (!nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const dados = { nome: nome.trim(), crp: crp || null };
      await salvarPerfil(dados);
      onSalvo((atual) => ({ ...atual, ...dados }));
      setSalvo(true);
    } catch (erroSalvar) {
      console.error(erroSalvar);
      setErro("Não foi possível salvar agora.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="config-secao">
      <h2>Perfil</h2>
      <form className="config-perfil-form" onSubmit={handleSalvar}>
        <div className="config-linha">
          <label className="field">
            <span className="field__label">Nome</span>
            <input className="field__input" value={nome} onChange={(e) => { setNome(e.target.value); setSalvo(false); }} />
          </label>
          <label className="field">
            <span className="field__label">CRP</span>
            <input
              className="field__input"
              value={crp}
              onChange={(e) => { setCrp(e.target.value); setSalvo(false); }}
              placeholder="06/123456"
            />
          </label>
        </div>

        {erro && <p className="erro-aviso">{erro}</p>}

        <div className="config-secao__acoes">
          <button type="submit" className="config-salvar" disabled={salvando}>
            {salvando ? "Salvando…" : salvo ? "Salvo ✓" : "Salvar"}
          </button>
        </div>
      </form>
    </section>
  );
}

function SecaoAparencia() {
  const [modo, setModo] = useState(obterModo());
  const [acento, setAcento] = useState(obterAcento());
  const [paleta, setPaleta] = useState(obterPaleta());

  function escolherModo(id) {
    definirModo(id);
    setModo(id);
  }

  function escolherAcento(id) {
    definirAcento(id);
    setAcento(id);
  }

  function escolherPaleta(id) {
    definirPaleta(id);
    setPaleta(id);
  }

  return (
    <section className="config-secao">
      <h2>Aparência</h2>

      <h3 className="config-subtitulo">Tema</h3>
      <p className="config-secao__ajuda">
        &quot;Automático&quot; acompanha o claro/escuro do seu computador ou celular.
        Funciona com qualquer paleta.
      </p>
      <div className="config-acentos">
        {MODOS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`config-acento config-acento--texto ${modo === item.id ? "is-active" : ""}`}
            onClick={() => escolherModo(item.id)}
            aria-pressed={modo === item.id}
          >
            {item.nome}
          </button>
        ))}
      </div>

      <h3 className="config-subtitulo">Paleta de cores</h3>
      <p className="config-secao__ajuda">
        Muda o fundo e as superfícies de todo o sistema — telas, cards e menus.
      </p>
      <div className="config-paletas">
        {PALETAS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`config-paleta ${paleta === item.id ? "is-active" : ""}`}
            onClick={() => escolherPaleta(item.id)}
            aria-pressed={paleta === item.id}
          >
            <span className="config-paleta__amostra" aria-hidden="true">
              <span style={{ background: item.amostra[0] }} />
              <span style={{ background: item.amostra[1] }} />
              <span style={{ background: item.amostra[2] }} />
            </span>
            {item.nome}
          </button>
        ))}
      </div>

      <h3 className="config-subtitulo">Cor de destaque</h3>
      <p className="config-secao__ajuda">
        A cor de botões, links, foco e navegação ativa. Funciona com qualquer paleta.
      </p>
      <div className="config-acentos">
        {ACENTOS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`config-acento ${acento === item.id ? "is-active" : ""}`}
            onClick={() => escolherAcento(item.id)}
            aria-pressed={acento === item.id}
          >
            <span className="config-acento__cor" style={{ background: item.cor }} />
            {item.nome}
          </button>
        ))}
      </div>
    </section>
  );
}

function SecaoSenha() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);

  async function handleSalvar(event) {
    event.preventDefault();
    setErro("");
    setSalvo(false);

    if (novaSenha.length < 6) {
      setErro("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("As senhas não são iguais.");
      return;
    }

    setSalvando(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: erroConferencia } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaAtual,
      });
      if (erroConferencia) {
        setErro("Senha atual incorreta.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) {
        setErro("Não foi possível trocar a senha agora. Tente de novo.");
        return;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
      setSalvo(true);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="config-secao">
      <h2>Segurança</h2>
      <form className="config-perfil-form" onSubmit={handleSalvar}>
        <label className="field">
          <span className="field__label">Senha atual</span>
          <input
            className="field__input"
            type="password"
            autoComplete="current-password"
            value={senhaAtual}
            onChange={(e) => { setSenhaAtual(e.target.value); setSalvo(false); }}
          />
        </label>

        <div className="config-linha">
          <label className="field">
            <span className="field__label">Nova senha</span>
            <input
              className="field__input"
              type="password"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => { setNovaSenha(e.target.value); setSalvo(false); }}
            />
          </label>
          <label className="field">
            <span className="field__label">Confirmar nova senha</span>
            <input
              className="field__input"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => { setConfirmacao(e.target.value); setSalvo(false); }}
            />
          </label>
        </div>

        {erro && <p className="erro-aviso">{erro}</p>}

        <div className="config-secao__acoes">
          <button type="submit" className="config-salvar" disabled={salvando || !senhaAtual || !novaSenha}>
            {salvando ? "Salvando…" : salvo ? "Senha alterada ✓" : "Alterar senha"}
          </button>
        </div>
      </form>
    </section>
  );
}

const ABRANGENCIA_LABEL = {
  municipal: "Municipal",
  estadual: "Estadual",
  personalizado: "Recesso / outro",
};

function rotuloDataFeriado(feriado) {
  const [ano, mes, dia] = feriado.data.split("-");
  if (feriado.repete_todo_ano) return `Todo dia ${dia}/${mes}`;
  return `${dia}/${mes}/${ano}`;
}

function SecaoFeriados() {
  const [feriados, setFeriados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [data, setData] = useState("");
  const [nome, setNome] = useState("");
  const [abrangencia, setAbrangencia] = useState("municipal");
  const [repeteTodoAno, setRepeteTodoAno] = useState(true);

  useEffect(() => {
    buscarFeriadosPersonalizados()
      .then(setFeriados)
      .catch(() => setErro("Não foi possível carregar os feriados."))
      .finally(() => setCarregando(false));
  }, []);

  async function recarregar() {
    const lista = await buscarFeriadosPersonalizados();
    setFeriados(lista);
    await sincronizarFeriados();
  }

  async function handleAdicionar(event) {
    event.preventDefault();
    setErro("");
    if (!data || !nome.trim()) {
      setErro("Preencha a data e o nome do feriado.");
      return;
    }
    setSalvando(true);
    try {
      await criarFeriado({ data, nome, abrangencia, repeteTodoAno });
      setData("");
      setNome("");
      await recarregar();
    } catch (erroCriar) {
      console.error(erroCriar);
      setErro("Não foi possível adicionar. Talvez esse feriado já exista.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(id) {
    setErro("");
    try {
      await apagarFeriado(id);
      await recarregar();
    } catch (erroRemover) {
      console.error(erroRemover);
      setErro("Não foi possível remover agora.");
    }
  }

  return (
    <section className="config-secao">
      <h2>Feriados e recessos</h2>
      <p className="config-secao__ajuda">
        Os feriados nacionais (Natal, Ano Novo, 7 de Setembro, Carnaval…) já aparecem sozinhos no calendário e se
        atualizam pela BrasilAPI. Aqui você adiciona só o que varia por cidade/estado ou é decisão da clínica —
        feriado municipal, estadual, recesso de fim de ano.
      </p>

      {carregando ? (
        <p className="config-vazio">Carregando…</p>
      ) : (
        <>
          {feriados.length > 0 && (
            <ul className="config-feriados">
              {feriados.map((feriado) => (
                <li key={feriado.id} className="config-feriado">
                  <div className="config-feriado__info">
                    <span className="config-feriado__nome">{feriado.nome}</span>
                    <span className="config-feriado__meta">
                      {rotuloDataFeriado(feriado)} · {ABRANGENCIA_LABEL[feriado.abrangencia] ?? feriado.abrangencia}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="config-feriado__remover"
                    onClick={() => handleRemover(feriado.id)}
                    aria-label={`Remover ${feriado.nome}`}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="config-feriado-form" onSubmit={handleAdicionar}>
            <div className="config-feriado-form__linha">
              <label className="field">
                <span className="field__label">Data</span>
                <input
                  type="date"
                  className="field__input"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field__label">Nome</span>
                <input
                  type="text"
                  className="field__input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Aniversário da cidade"
                />
              </label>
            </div>

            <div className="config-feriado-form__linha">
              <label className="field">
                <span className="field__label">Abrangência</span>
                <select
                  className="field__input"
                  value={abrangencia}
                  onChange={(e) => setAbrangencia(e.target.value)}
                >
                  <option value="municipal">Municipal</option>
                  <option value="estadual">Estadual</option>
                  <option value="personalizado">Recesso / outro</option>
                </select>
              </label>
              <label className="config-feriado-form__repete">
                <input
                  type="checkbox"
                  checked={repeteTodoAno}
                  onChange={(e) => setRepeteTodoAno(e.target.checked)}
                />
                <span>Repete todo ano</span>
              </label>
            </div>

            {erro && <p className="erro-aviso">{erro}</p>}

            <div className="config-secao__acoes">
              <button type="submit" className="config-salvar" disabled={salvando}>
                {salvando ? "Adicionando…" : "Adicionar feriado"}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}

function SecaoHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    buscarHorariosSemana()
      .then(setHorarios)
      .catch(() => setErro("Não foi possível carregar os horários."))
      .finally(() => setCarregando(false));
  }, []);

  function alterarDia(id, campo, valor) {
    setHorarios((atuais) => atuais.map((dia) => (dia.id === id ? { ...dia, [campo]: valor } : dia)));
    setSalvo(false);
  }

  async function handleSalvar() {
    setSalvando(true);
    setErro("");
    try {
      await Promise.all(
        horarios.map((dia) =>
          salvarHorarioDia(dia.id, {
            ativo: dia.ativo,
            hora_inicio: dia.hora_inicio,
            hora_fim: dia.hora_fim,
            duracao_padrao_minutos: Number(dia.duracao_padrao_minutos),
          })
        )
      );
      setSalvo(true);
    } catch (erroSalvar) {
      console.error(erroSalvar);
      setErro("Não foi possível salvar os horários agora.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="config-secao">
      <h2>Horários de atendimento</h2>
      <p className="config-secao__ajuda">
        Define quando a agenda considera o dia disponível e quantas vagas cabem (usado na ocupação da semana e para
        calcular horário de encerramento no lançamento rápido).
      </p>

      {carregando ? (
        <p className="config-vazio">Carregando…</p>
      ) : (
        <>
          <div className="config-horarios">
            {horarios.map((dia) => (
              <div key={dia.id} className={`config-horario-dia ${dia.ativo ? "" : "config-horario-dia--inativo"}`}>
                <label className="config-horario-dia__toggle">
                  <input
                    type="checkbox"
                    checked={dia.ativo}
                    onChange={(e) => alterarDia(dia.id, "ativo", e.target.checked)}
                  />
                  <span>{NOMES_DIA[dia.dia_semana]}</span>
                </label>

                {dia.ativo && (
                  <div className="config-horario-dia__campos">
                    <input
                      type="time"
                      className="field__input"
                      aria-label={`Início do atendimento — ${NOMES_DIA[dia.dia_semana]}`}
                      value={dia.hora_inicio?.slice(0, 5)}
                      onChange={(e) => alterarDia(dia.id, "hora_inicio", e.target.value)}
                    />
                    <span>até</span>
                    <input
                      type="time"
                      className="field__input"
                      aria-label={`Fim do atendimento — ${NOMES_DIA[dia.dia_semana]}`}
                      value={dia.hora_fim?.slice(0, 5)}
                      onChange={(e) => alterarDia(dia.id, "hora_fim", e.target.value)}
                    />
                    <input
                      type="number"
                      min="10"
                      step="5"
                      className="field__input config-horario-dia__duracao"
                      value={dia.duracao_padrao_minutos}
                      onChange={(e) => alterarDia(dia.id, "duracao_padrao_minutos", e.target.value)}
                      aria-label={`Duração padrão da consulta em minutos — ${NOMES_DIA[dia.dia_semana]}`}
                      title="Duração padrão da consulta (min)"
                    />
                    <span className="config-horario-dia__unidade">min</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {erro && <p className="erro-aviso">{erro}</p>}

          <div className="config-secao__acoes">
            <button type="button" className="config-salvar" onClick={handleSalvar} disabled={salvando}>
              {salvando ? "Salvando…" : salvo ? "Salvo ✓" : "Salvar horários"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
