// Feriados do calendário. Três camadas, todas consultadas por `feriadoEm`:
//
// 1. Nacionais calculados aqui (offline): fixos por lei (662/1949, 6.802/1980,
//    14.759/2023) + móveis da Páscoa (Carnaval, Sexta-feira Santa, Corpus
//    Christi). É a base e a reserva quando não há rede.
// 2. Nacionais da BrasilAPI (online): quando a sincronização roda, a lista
//    oficial de um ano entra por cima do cálculo — pega mudanças de lei sem
//    depender de deploy. A BrasilAPI omite Carnaval/Corpus Christi (ponto
//    facultativo), por isso a camada 1 continua preenchendo esses.
// 3. Personalizados do Supabase: municipal, estadual e recesso da clínica.
//
// O carregamento das camadas 2 e 3 fica em src/lib/feriadosRemotos.js e é
// disparado uma vez após o login. `feriadoEm` segue síncrono lendo caches
// de módulo.

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

// Feriados personalizados (municipal/estadual/recesso) que vêm do Supabase.
// Ficam num cache de módulo para o `feriadoEm` seguir síncrono — quem carrega
// do banco (src/lib/feriadosRemotos.js) chama `definirFeriadosPersonalizados`
// uma vez no login. `exatos`: "yyyy-mm-dd" → nome. `anuais`: "mm-dd" → nome.
let personalizados = { exatos: new Map(), anuais: new Map() };

// Camada 2: feriados nacionais oficiais vindos da BrasilAPI, por ano já
// mesclados sobre o cálculo local. ano → Map("yyyy-mm-dd" → nome).
const nacionaisOnlinePorAno = new Map();

/**
 * Registra a lista de feriados personalizados vinda do banco.
 * `lista`: objetos { data: "yyyy-mm-dd", nome, repete_todo_ano }.
 */
export function definirFeriadosPersonalizados(lista) {
  const exatos = new Map();
  const anuais = new Map();
  for (const item of lista ?? []) {
    if (!item?.data || !item?.nome) continue;
    if (item.repete_todo_ano) anuais.set(item.data.slice(5), item.nome);
    else exatos.set(item.data, item.nome);
  }
  personalizados = { exatos, anuais };
}

/**
 * Registra os feriados nacionais de um ano vindos da BrasilAPI, mesclados
 * sobre o cálculo local (que mantém Carnaval e Corpus Christi, omitidos pela
 * API). `listaApi`: objetos { date: "yyyy-mm-dd", name }.
 */
export function definirFeriadosNacionaisOnline(ano, listaApi) {
  const mesclado = new Map(feriadosDoAno(ano));
  for (const item of listaApi ?? []) {
    if (typeof item?.date === "string" && item?.name) mesclado.set(item.date, item.name);
  }
  nacionaisOnlinePorAno.set(ano, mesclado);
}

/** Zera as camadas carregadas em runtime (uso em logout e nos testes). */
export function reiniciarFeriados() {
  personalizados = { exatos: new Map(), anuais: new Map() };
  nacionaisOnlinePorAno.clear();
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

/**
 * Nome do feriado nessa data ISO ("yyyy-mm-dd"), ou null se não houver.
 * Ordem: nacional oficial da BrasilAPI (se o ano foi sincronizado) ou o
 * cálculo local; depois os personalizados do Supabase.
 */
export function feriadoEm(dataISO) {
  if (typeof dataISO !== "string" || dataISO.length < 10) return null;
  const ano = Number(dataISO.slice(0, 4));
  if (!Number.isInteger(ano)) return null;
  const nacionais = nacionaisOnlinePorAno.get(ano) ?? feriadosDoAno(ano);
  return (
    nacionais.get(dataISO) ??
    personalizados.exatos.get(dataISO) ??
    personalizados.anuais.get(dataISO.slice(5)) ??
    null
  );
}
