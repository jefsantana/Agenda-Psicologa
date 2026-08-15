import "./AbasHorizontais.css";

export default function AbasHorizontais({ abas, ativa, onMudar }) {
  return (
    <div className="abas-horizontais" role="tablist">
      {abas.map((aba) => (
        <button
          key={aba.id}
          type="button"
          role="tab"
          aria-selected={ativa === aba.id}
          className={ativa === aba.id ? "is-active" : ""}
          onClick={() => onMudar(aba.id)}
        >
          {aba.rotulo}
        </button>
      ))}
    </div>
  );
}
