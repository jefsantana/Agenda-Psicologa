/*
  Aparência do sistema — uma escolha só: modo claro / escuro / automático
  (segue o sistema operacional). Um atributo no <html> (data-mode) e uma
  chave no localStorage.

  Antes existiam mais duas escolhas independentes (cor de destaque e paleta
  de fundo, combinadas em até 24 variações — ver tokens.css v8). Foram
  removidas: cada paleta/acento novo exigia redefinir a lista inteira de
  tokens em cada bloco, e um esquecimento (tokens novos nunca adicionados
  aos blocos claros) foi o que deixou botões e linhas de lista praticamente
  pretos no modo claro. Só o modo claro/escuro precisa de dois blocos no CSS
  (tokens.css), então é a única variação que continua existindo.
*/

const CHAVE_MODO = "espaco-raquel-frois:modo";

export const MODOS = [
  { id: "auto", nome: "Automático" },
  { id: "claro", nome: "Claro" },
  { id: "escuro", nome: "Escuro" },
];

const MODOS_VALIDOS = new Set(MODOS.map((m) => m.id));

export function obterModo() {
  const salvo = localStorage.getItem(CHAVE_MODO);
  // Padrão "escuro" (não "auto"): a marca é o vinho/lavanda escuro do login
  // (ver README) — sem isto, quem nunca mexeu em Configurações via o app
  // abrir no modo claro do sistema logo após um login sempre escuro.
  if (!salvo || !MODOS_VALIDOS.has(salvo)) return "escuro";
  return salvo;
}

export function definirModo(id) {
  aplicarModo(id);
  localStorage.setItem(CHAVE_MODO, id);
}

const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)");

/*
  O <html> sempre fica com data-mode="claro" ou "escuro" — nunca "auto". Quando
  o usuário escolhe "Automático", resolvemos aqui pelo prefers-color-scheme e
  reaplicamos sempre que o sistema alternar (o listener abaixo). O CSS
  (tokens.css) só precisa olhar para "claro" / "escuro".
*/
function aplicarModo(id) {
  const efetivo = id === "auto" ? (prefereEscuro.matches ? "escuro" : "claro") : id;
  document.documentElement.setAttribute("data-mode", efetivo);
}

prefereEscuro.addEventListener("change", () => {
  if (obterModo() === "auto") aplicarModo("auto");
});

aplicarModo(obterModo());
