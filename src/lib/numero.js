/** Converte texto digitado (vírgula ou ponto decimal) num número JS. */
export function paraNumero(texto) {
  if (texto === null || texto === undefined) return null;
  const limpo = String(texto).trim().replace(/\./g, "").replace(",", ".");
  if (limpo === "") return null;
  const numero = Number(limpo);
  return Number.isNaN(numero) ? null : numero;
}

/** Formata um número como texto de campo, com vírgula decimal (sem símbolo de moeda). */
export function paraTextoValor(numero) {
  if (numero === null || numero === undefined || numero === "") return "";
  return Number(numero).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
