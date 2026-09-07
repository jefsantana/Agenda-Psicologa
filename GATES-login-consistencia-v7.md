# Gates: Login consistente com o redesign v7 (carvão/azul)

OWNS: src/pages/LoginPage.jsx, src/pages/LoginPage.css

Scope: a tela de login (`/entrar`) ainda usava o visual antigo v6 (foto de fundo roxo/lavanda, cartão com vidro/blur pesado, título em peso 500, botão com sombra colorida e borda translúcida) enquanto todo o resto do app já foi migrado para o v7 (fundo carvão liso, cards planos sem sombra/vidro, título em peso 800). Usuário confirmou explicitamente a opção "Carvão liso, sem foto": removida a foto de fundo e o vidro, cartão agora usa `var(--surface)`/`var(--border)` como qualquer outro painel do app, título/avatar/botão/campos reaproveitam exatamente os mesmos tokens e classes compartilhadas (`.field`, `.field__input`) usadas no resto do sistema. Como efeito colateral positivo, o login agora também respeita corretamente o modo claro/escuro escolhido nas Configurações (antes forçava sempre cores escuras por cima da foto, mesmo no tema claro).

- [x] G1: Foto de fundo e vidro (glassmorphism) removidos do login
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/LoginPage.css','utf8'); for(const t of ['login-bg.webp','backdrop-filter','box-shadow']) if(s.includes(t)) throw new Error('resquicio do v6 ainda presente: '+t); console.log('SEM_VIDRO_OK')"
  EXPECT: SEM_VIDRO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=SEM_VIDRO_OK

- [x] G2: Cartão do login usa os mesmos tokens planos de superfície do resto do app (surface/border), não valores fixos ou translúcidos
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/LoginPage.css','utf8'); if(!/\.login__conteudo\s*{[^}]*background:\s*var\(--surface\)/.test(s)) throw new Error('cartao nao usa var(--surface)'); if(!/border:\s*1px solid var\(--border\)/.test(s)) throw new Error('cartao nao usa var(--border)'); console.log('SURFACE_PADRAO_OK')"
  EXPECT: SURFACE_PADRAO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=SURFACE_PADRAO_OK

- [x] G3: Campos e rótulos do formulário reaproveitam as classes globais compartilhadas (.field/.field__label/.field__input), não uma cópia própria do login
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/LoginPage.jsx','utf8'); if(s.includes('login__campo') || s.includes('login__input')) throw new Error('ainda usa classes proprias de campo'); for(const t of ['className=\"field\"','className=\"field__label\"','className=\"field__input\"']) if(!s.includes(t)) throw new Error('faltando: '+t); console.log('CAMPOS_COMPARTILHADOS_OK')"
  EXPECT: CAMPOS_COMPARTILHADOS_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=CAMPOS_COMPARTILHADOS_OK

- [x] G4: Título do login não força mais peso 500 — herda o peso 800 padrão de h1 usado em todo o resto do app
  CHECK: node -e "const s=require('fs').readFileSync('src/pages/LoginPage.css','utf8'); const m=s.match(/\.login__titulo\s*{[^}]*}/); if(m && /font-weight/.test(m[0])) throw new Error('ainda sobrescreve font-weight do h1'); console.log('PESO_H1_PADRAO_OK')"
  EXPECT: PESO_H1_PADRAO_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output=PESO_H1_PADRAO_OK

- [x] G5: Lint limpo no projeto inteiro
  CHECK: npx oxlint . && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; EXPECT=matched; output includes LINT_OK

- [x] G6: Confirmação visual ao vivo — login bate com o resto do app no escuro e no claro, incluindo os fluxos de recuperação de senha
  EVIDENCE: navegador, /entrar, após reload completo. Escuro: fundo carvão liso (igual ao Dashboard), cartão plano com borda sutil, avatar "RF" no mesmo gradiente azul do avatar da sidebar, título "Espaço Raquel Fróis" em peso bold igual aos títulos de página, campos com o mesmo anel de foco azul usado no resto do app, botão "Entrar" plano sem sombra extra — igual aos botões primários de Financeiro/Convênios. Testado "Esqueci minha senha" → mesmo cartão, mesmo estilo. Alternando `data-mode` para "claro" via console: cartão virou branco com texto escuro, replicando exatamente o tema claro do resto do app (antes o login ficava sempre escuro sobre a foto, ignorando o tema escolhido). Restaurado para "escuro" ao final.
