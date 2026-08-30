const CHAVE = "espaco-raquel-frois:acento";

export const ACENTOS = [
  { id: "padrao", nome: "Lavanda", cor: "#8e6aea" },
  { id: "azul", nome: "Azul", cor: "#3b82f6" },
  { id: "rosa", nome: "Rosa", cor: "#e8639a" },
  { id: "verde", nome: "Verde consultório", cor: "#1f9382" },
];

const IDS_VALIDOS = new Set(ACENTOS.map((a) => a.id));

export function obterAcento() {
  const salvo = localStorage.getItem(CHAVE);
  // "roxo" era o id da opção antiga que virou o padrão atual (lavanda).
  if (salvo === "roxo") return "padrao";
  if (!salvo || !IDS_VALIDOS.has(salvo)) return "padrao";
  return salvo;
}

export function definirAcento(id) {
  document.documentElement.setAttribute("data-accent", id);
  localStorage.setItem(CHAVE, id);
}

document.documentElement.setAttribute("data-accent", obterAcento());
