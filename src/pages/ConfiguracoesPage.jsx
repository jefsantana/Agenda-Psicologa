import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import { buscarPerfil, salvarPerfil } from "../lib/perfil.js";
import { buscarHorariosSemana, salvarHorarioDia } from "../lib/configuracoes.js";
import { ACENTOS, definirAcento, obterAcento } from "../lib/tema.js";
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
  const [acento, setAcento] = useState(obterAcento());

  function escolher(id) {
    definirAcento(id);
    setAcento(id);
  }

  return (
    <section className="config-secao">
      <h2>Aparência</h2>
      <p className="config-secao__ajuda">Escolha a cor de destaque do sistema.</p>

      <div className="config-acentos">
        {ACENTOS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`config-acento ${acento === item.id ? "is-active" : ""}`}
            onClick={() => escolher(item.id)}
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
                      value={dia.hora_inicio?.slice(0, 5)}
                      onChange={(e) => alterarDia(dia.id, "hora_inicio", e.target.value)}
                    />
                    <span>até</span>
                    <input
                      type="time"
                      className="field__input"
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
