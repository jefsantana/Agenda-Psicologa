import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lib/tema.js'
import './index.css'
import App from './App.jsx'
import { supabase } from './lib/supabaseClient.js'

/**
 * O app usa HashRouter (rotas em "#/..."), mas o link de recuperação de
 * senha do Supabase também devolve o usuário com dados na parte "#" da URL
 * ("#access_token=...&type=recovery&refresh_token=..." ou, se o link
 * expirou/já foi usado, "#error=...&error_description=..."). As duas coisas
 * disputam o mesmo hash: sem tratar isso ANTES de montar o HashRouter, a
 * rota coringa ("*") não reconhece esse "caminho" e redireciona pra
 * "/entrar", apagando o hash antes do Supabase conseguir lê-lo — a tela de
 * nova senha nunca aparece, e o link parece simplesmente não fazer nada.
 *
 * Aqui a gente lê o hash primeiro, aplica a sessão de recuperação (ou guarda
 * o erro) manualmente, avisa a LoginPage via sessionStorage (o evento
 * PASSWORD_RECOVERY do Supabase não dispara quando a sessão é setada assim,
 * só quando é o próprio cliente que detecta a URL) e só then troca o hash
 * por uma rota válida antes de montar o React.
 */
async function iniciar() {
  const hash = window.location.hash;

  if (hash.includes('type=recovery') || hash.includes('error=')) {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const erroDescricao = params.get('error_description');

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      sessionStorage.setItem(
        'recuperacaoSenha',
        error ? JSON.stringify({ erro: 'Link de recuperação inválido ou expirado. Peça um novo.' }) : JSON.stringify({ ok: true })
      );
    } else if (erroDescricao) {
      sessionStorage.setItem('recuperacaoSenha', JSON.stringify({ erro: erroDescricao.replace(/\+/g, ' ') }));
    }

    window.location.hash = '#/entrar';
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

iniciar();
