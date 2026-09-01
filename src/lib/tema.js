/*
  Aparência do sistema — três escolhas independentes, cada uma um atributo no
  <html> e uma chave no localStorage:

  - data-mode    → claro / escuro / automático (segue o sistema operacional).
  - data-accent  → cor de destaque (botões, foco, navegação ativa, badges).
  - data-theme   → paleta de fundo e superfícies (o "clima" da tela).

  Os valores de cada uma estão em src/styles/tokens.css (blocos
  :root[data-accent="…"], :root[data-theme="…"] e o bloco claro). As três se
  combinam.

  Modo claro e escuro valem para as quatro paletas.
*/

const CHAVE_MODO = "espaco-raquel-frois:modo";
const CHAVE_ACENTO = "espaco-raquel-frois:acento";
const CHAVE_PALETA = "espaco-raquel-frois:paleta";

export const MODOS = [
  { id: "auto", nome: "Automático" },
  { id: "claro", nome: "Claro" },
  { id: "escuro", nome: "Escuro" },
];

const MODOS_VALIDOS = new Set(MODOS.map((m) => m.id));

export const ACENTOS = [
  { id: "padrao", nome: "Lavanda", cor: "#8e6aea" },
  { id: "azul", nome: "Azul", cor: "#3b82f6" },
  { id: "rosa", nome: "Rosa", cor: "#e8639a" },
  { id: "verde", nome: "Verde consultório", cor: "#1f9382" },
];

/*
  Paletas de fundo. `amostra` são as cores mostradas no seletor de
  Configurações (fundo, superfície, texto), só para pré-visualização.
*/
export const PALETAS = [
  { id: "ameixa", nome: "Ameixa", amostra: ["#1c0b15", "#2e1727", "#f5eef3"] },
  { id: "carvao", nome: "Carvão", amostra: ["#0f1012", "#1e2126", "#e6e8ee"] },
  { id: "ardosia", nome: "Ardósia", amostra: ["#0e1420", "#1b2334", "#e7ecf5"] },
  { id: "cafe", nome: "Café", amostra: ["#17110d", "#261c15", "#f3ece4"] },
];

const ACENTOS_VALIDOS = new Set(ACENTOS.map((a) => a.id));
const PALETAS_VALIDAS = new Set(PALETAS.map((p) => p.id));

export function obterModo() {
  const salvo = localStorage.getItem(CHAVE_MODO);
  if (!salvo || !MODOS_VALIDOS.has(salvo)) return "auto";
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

export function obterAcento() {
  const salvo = localStorage.getItem(CHAVE_ACENTO);
  // "roxo" era o id da opção antiga que virou o padrão atual (lavanda).
  if (salvo === "roxo") return "padrao";
  if (!salvo || !ACENTOS_VALIDOS.has(salvo)) return "padrao";
  return salvo;
}

export function definirAcento(id) {
  document.documentElement.setAttribute("data-accent", id);
  localStorage.setItem(CHAVE_ACENTO, id);
}

export function obterPaleta() {
  const salvo = localStorage.getItem(CHAVE_PALETA);
  if (!salvo || !PALETAS_VALIDAS.has(salvo)) return "ameixa";
  return salvo;
}

export function definirPaleta(id) {
  document.documentElement.setAttribute("data-theme", id);
  localStorage.setItem(CHAVE_PALETA, id);
}

aplicarModo(obterModo());
document.documentElement.setAttribute("data-accent", obterAcento());
document.documentElement.setAttribute("data-theme", obterPaleta());
