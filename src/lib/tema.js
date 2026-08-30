/*
  Aparência do sistema — duas escolhas independentes, cada uma um atributo no
  <html> e uma chave no localStorage:

  - data-accent  → cor de destaque (botões, foco, navegação ativa, badges).
  - data-theme   → paleta de fundo e superfícies (o "clima" da tela).

  Os valores de cada uma estão em src/styles/tokens.css (blocos
  :root[data-accent="…"] e :root[data-theme="…"]). As duas se combinam:
  qualquer acento funciona sobre qualquer paleta.
*/

const CHAVE_ACENTO = "espaco-raquel-frois:acento";
const CHAVE_PALETA = "espaco-raquel-frois:paleta";

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

document.documentElement.setAttribute("data-accent", obterAcento());
document.documentElement.setAttribute("data-theme", obterPaleta());
