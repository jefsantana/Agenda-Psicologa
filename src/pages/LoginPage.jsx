import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import "./LoginPage.css";

const MENSAGENS_ERRO = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [recuperarAberto, setRecuperarAberto] = useState(false);
  const [modoNovaSenha, setModoNovaSenha] = useState(false);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setModoNovaSenha(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!email || !senha) {
      setErro("Preencha e-mail e senha para entrar.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);

    if (error) {
      setErro(MENSAGENS_ERRO[error.message] ?? "Não foi possível entrar. Tente novamente.");
      return;
    }

    navigate("/hoje");
  }

  return (
    <main className="login">
      <div className="login__glow" aria-hidden="true" />

      <div className="login__conteudo">
        <div className="login__marca">
          <span className="login__avatar">RF</span>
          <h1 className="login__titulo">
            Espaço
            <br />
            Raquel Fróis
          </h1>
          <p className="login__subtitulo">Agenda, prontuário e financeiro da sua prática clínica.</p>
        </div>

        {modoNovaSenha ? (
          <NovaSenha aoConcluir={() => navigate("/hoje")} />
        ) : recuperarAberto ? (
          <RecuperarSenha aoVoltar={() => setRecuperarAberto(false)} />
        ) : (
          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <label className="login__campo">
              <span className="login__campo-rotulo">E-mail profissional</span>
              <input
                className="login__input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-mail profissional"
              />
            </label>

            <label className="login__campo">
              <span className="login__campo-rotulo">Senha</span>
              <input
                className="login__input"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Senha"
              />
            </label>

            {erro && (
              <p className="login__erro" role="alert">
                {erro}
              </p>
            )}

            <button className="login__entrar" type="submit" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </button>

            <button type="button" className="login__esqueci" onClick={() => setRecuperarAberto(true)}>
              Esqueci minha senha
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function RecuperarSenha({ aoVoltar }) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [status, setStatus] = useState(null); // null | "enviado" | "erro"

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email) return;
    setEnviando(true);
    setStatus(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    setEnviando(false);
    setStatus(error ? "erro" : "enviado");
  }

  return (
    <form className="login__form" onSubmit={handleSubmit}>
      <p className="login__recuperar-texto">
        Digite seu e-mail de acesso. Vamos enviar um link para você criar uma senha nova.
      </p>

      <label className="login__campo">
        <span className="login__campo-rotulo">E-mail profissional</span>
        <input
          className="login__input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-mail profissional"
          autoFocus
        />
      </label>

      {status === "enviado" && (
        <p className="login__sucesso">Enviamos um link de recuperação para o seu e-mail.</p>
      )}
      {status === "erro" && <p className="login__erro">Não foi possível enviar agora. Tente de novo.</p>}

      <button className="login__entrar" type="submit" disabled={enviando || !email}>
        {enviando ? "Enviando…" : "Enviar link"}
      </button>

      <button type="button" className="login__esqueci" onClick={aoVoltar}>
        Voltar para o login
      </button>
    </form>
  );
}

function NovaSenha({ aoConcluir }) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("As senhas não são iguais.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);

    if (error) {
      setErro("Não foi possível salvar a nova senha. Peça um novo link e tente de novo.");
      return;
    }

    aoConcluir();
  }

  return (
    <form className="login__form" onSubmit={handleSubmit}>
      <p className="login__recuperar-texto">Defina sua nova senha para continuar.</p>

      <label className="login__campo">
        <span className="login__campo-rotulo">Nova senha</span>
        <input
          className="login__input"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          placeholder="Nova senha"
          autoFocus
        />
      </label>

      <label className="login__campo">
        <span className="login__campo-rotulo">Confirmar nova senha</span>
        <input
          className="login__input"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(event) => setConfirmacao(event.target.value)}
          placeholder="Confirmar nova senha"
        />
      </label>

      {erro && (
        <p className="login__erro" role="alert">
          {erro}
        </p>
      )}

      <button className="login__entrar" type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar nova senha e entrar"}
      </button>
    </form>
  );
}
