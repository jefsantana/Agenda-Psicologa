// Feriados nacionais do Brasil, calculados localmente — sem chamada de rede,
// para a app seguir funcionando offline como o resto do calendário.
//
// Cobre os feriados nacionais fixos (Leis 662/1949, 6.802/1980, 14.759/2023) e
// os móveis derivados da Páscoa (Carnaval, Sexta-feira Santa, Corpus Christi).
// NÃO inclui feriados estaduais/municipais nem pontos facultativos — uma lista
// editável de feriados locais pode entrar em Configurações mais adiante.

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano). */
function domingoDePascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = março, 4 = abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function isoLocal(date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function somarDias(date, dias) {
  const resultado = new Date(date);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

const cachePorAno = new Map();

/** Map de "yyyy-mm-dd" → nome do feriado, para o ano informado. */
export function feriadosDoAno(ano) {
  const emCache = cachePorAno.get(ano);
  if (emCache) return emCache;

  const pascoa = domingoDePascoa(ano);
  const feriados = new Map([
    [`${ano}-01-01`, "Confraternização Universal"],
    [isoLocal(somarDias(pascoa, -48)), "Carnaval"],
    [isoLocal(somarDias(pascoa, -47)), "Carnaval"],
    [isoLocal(somarDias(pascoa, -2)), "Sexta-feira Santa"],
    [`${ano}-04-21`, "Tiradentes"],
    [`${ano}-05-01`, "Dia do Trabalho"],
    [isoLocal(somarDias(pascoa, 60)), "Corpus Christi"],
    [`${ano}-09-07`, "Independência do Brasil"],
    [`${ano}-10-12`, "Nossa Senhora Aparecida"],
    [`${ano}-11-02`, "Finados"],
    [`${ano}-11-15`, "Proclamação da República"],
    [`${ano}-11-20`, "Dia da Consciência Negra"],
    [`${ano}-12-25`, "Natal"],
  ]);

  cachePorAno.set(ano, feriados);
  return feriados;
}

/** Nome do feriado nessa data ISO ("yyyy-mm-dd"), ou null se não houver. */
export function feriadoEm(dataISO) {
  if (typeof dataISO !== "string" || dataISO.length < 4) return null;
  const ano = Number(dataISO.slice(0, 4));
  if (!Number.isInteger(ano)) return null;
  return feriadosDoAno(ano).get(dataISO) ?? null;
}
