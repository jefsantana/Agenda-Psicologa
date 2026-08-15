const CHAVE = "espaco-raquel-frois:acento";

export const ACENTOS = [
  { id: "roxo", nome: "Roxo", cor: "#7c6bf5" },
  { id: "azul", nome: "Azul", cor: "#3b82f6" },
  { id: "verde", nome: "Verde", cor: "#22b573" },
  { id: "rosa", nome: "Rosa", cor: "#e8639a" },
];

export function obterAcento() {
  return localStorage.getItem(CHAVE) || "roxo";
}

export function definirAcento(id) {
  document.documentElement.setAttribute("data-accent", id);
  localStorage.setItem(CHAVE, id);
}

document.documentElement.setAttribute("data-accent", obterAcento());
