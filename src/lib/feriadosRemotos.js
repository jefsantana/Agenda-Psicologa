import { supabase } from "./supabaseClient.js";
import { definirFeriadosPersonalizados, definirFeriadosNacionaisOnline } from "./feriados.js";

const BRASILAPI_FERIADOS = "https://brasilapi.com.br/api/feriados/v1";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

/** Lista os feriados personalizados (municipal/estadual/recesso) do banco. */
export async function buscarFeriadosPersonalizados() {
  const { data, error } = await supabase
    .from("feriados")
    .select("id, data, nome, abrangencia, repete_todo_ano")
    .order("data", { ascending: true });
  if (error) throw error;
  return data;
}

async function sincronizarPersonalizados() {
  try {
    const lista = await buscarFeriadosPersonalizados();
    definirFeriadosPersonalizados(lista);
  } catch {
    // Sem rede ou sem permissão: segue só com os feriados nacionais.
    definirFeriadosPersonalizados([]);
  }
}

/** Feriados nacionais de um ano pela BrasilAPI, com cache de 7 dias no navegador. */
async function buscarFeriadosNacionais(ano) {
  const chave = `feriados-br-${ano}`;
  try {
    const bruto = localStorage.getItem(chave);
    if (bruto) {
      const { quando, lista } = JSON.parse(bruto);
      if (Array.isArray(lista) && Date.now() - quando < CACHE_TTL_MS) return lista;
    }
  } catch {
    // cache ausente ou inválido — busca na rede
  }

  const resposta = await fetch(`${BRASILAPI_FERIADOS}/${ano}`);
  if (!resposta.ok) throw new Error(`BrasilAPI respondeu ${resposta.status}`);
  const lista = await resposta.json();

  try {
    localStorage.setItem(chave, JSON.stringify({ quando: Date.now(), lista }));
  } catch {
    // storage indisponível/cheio — segue sem cachear
  }
  return lista;
}

async function sincronizarNacionais() {
  const anoAtual = new Date().getFullYear();
  await Promise.all(
    [anoAtual, anoAtual + 1].map(async (ano) => {
      try {
        const lista = await buscarFeriadosNacionais(ano);
        definirFeriadosNacionaisOnline(ano, lista);
      } catch {
        // Sem rede: o cálculo local já cobre esse ano.
      }
    })
  );
}

/**
 * Atualiza as camadas online do calendário: feriados nacionais pela BrasilAPI
 * e os personalizados do Supabase. Chamado uma vez após o login; qualquer
 * falha é silenciosa e o cálculo local assume.
 */
export async function sincronizarFeriados() {
  await Promise.all([sincronizarNacionais(), sincronizarPersonalizados()]);
}

export async function criarFeriado({ data, nome, abrangencia, repeteTodoAno }) {
  const { error } = await supabase.from("feriados").insert({
    data,
    nome: nome.trim(),
    abrangencia: abrangencia || "personalizado",
    repete_todo_ano: !!repeteTodoAno,
  });
  if (error) throw error;
}

export async function apagarFeriado(id) {
  const { error } = await supabase.from("feriados").delete().eq("id", id);
  if (error) throw error;
}
