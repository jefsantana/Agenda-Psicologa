import AbasHorizontais from "../ui/AbasHorizontais.jsx";

const ABAS = [
  { id: "historico", rotulo: "Histórico" },
  { id: "dados", rotulo: "Dados" },
];

export default function AbasProntuario({ aba, onMudar }) {
  return <AbasHorizontais abas={ABAS} ativa={aba} onMudar={onMudar} />;
}
