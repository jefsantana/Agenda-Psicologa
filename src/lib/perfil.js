import { supabase } from "./supabaseClient.js";

/** Perfil da profissional (nome, CRP, meta). Cai para o e-mail se ainda não preencheu o perfil. */
export async function buscarPerfil() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("perfis_profissional")
    .select("nome, crp, plano, expira_em, meta_mensal")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    id: user.id,
    email: user.email,
    ...(data ?? { nome: user.email, crp: null, plano: "trial", expira_em: null, meta_mensal: 6000 }),
  };
}

/** Cria o perfil na primeira vez, atualiza depois — sempre existe um único registro por profissional. */
export async function salvarPerfil(dados) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");

  const { error } = await supabase.from("perfis_profissional").upsert({ id: user.id, ...dados });
  if (error) throw error;
}
