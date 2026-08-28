const CHAVE = "espaco-raquel-frois:acento";

export const ACENTOS = [
  { id: "padrao", nome: "Verde consultório", cor: "#1f9382" },
  { id: "azul", nome: "Azul", cor: "#3b82f6" },
  { id: "rosa", nome: "Rosa", cor: "#e8639a" },
];

export function obterAcento() {
  const salvo = localStorage.getItem(CHAVE);
  // "roxo" e "verde" eram opções antigas; ambas caem no acento padrão atual.
  if (!salvo || salvo === "roxo" || salvo === "verde") return "padrao";
  return salvo;
}

export function definirAcento(id) {
  document.documentElement.setAttribute("data-accent", id);
  localStorage.setItem(CHAVE, id);
}

document.documentElement.setAttribute("data-accent", obterAcento());
