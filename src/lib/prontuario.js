import { supabase } from "./supabaseClient.js";

const SELECT_PACIENTE_PRONTUARIO =
  "id, nome, nascimento, sexo, estado_civil, filiacao, escolaridade, profissao, rg, cpf, endereco, telefone, email, data_inicio_terapia";

export async function buscarPacienteParaProntuario(pacienteId) {
  const { data, error } = await supabase
    .from("pacientes")
    .select(SELECT_PACIENTE_PRONTUARIO)
    .eq("id", pacienteId)
    .single();
  if (error) throw error;
  return data;
}

/** Garante que existe um prontuário para o paciente (cria na primeira vez) e devolve ele. */
export async function buscarOuCriarProntuario(pacienteId) {
  const { data: existente, error: erroBusca } = await supabase
    .from("prontuarios")
    .select("*")
    .eq("paciente_id", pacienteId)
    .maybeSingle();
  if (erroBusca) throw erroBusca;

  if (existente) return existente;

  const { data: criado, error: erroCriar } = await supabase
    .from("prontuarios")
    .insert({ paciente_id: pacienteId })
    .select("*")
    .single();
  if (erroCriar) throw erroCriar;
  return criado;
}

export async function atualizarProntuario(id, dados) {
  const { error } = await supabase.from("prontuarios").update(dados).eq("id", id);
  if (error) throw error;
}

/** Linha do tempo de presença do paciente — substitui o antigo registro de evolução por texto livre. */
export async function buscarHistoricoAtendimentos(pacienteId) {
  const { data, error } = await supabase
    .from("atendimentos")
    .select("id, inicio, tipo, status")
    .eq("paciente_id", pacienteId)
    .order("inicio", { ascending: false });
  if (error) throw error;
  return data.map((linha) => ({ ...linha, inicio: new Date(linha.inicio) }));
}

/** Trilha de auditoria LGPD: quem acessou o quê e quando. Nunca bloqueia a ação em caso de falha. */
export async function registrarAuditoria({ acao, entidade, entidadeId }) {
  try {
    // getSession() lê do armazenamento local (sem ida à rede); getUser() faria
    // um request extra a cada abertura de prontuário.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from("audit_log").insert({ ator_id: session.user.id, acao, entidade, entidade_id: entidadeId });
  } catch (erro) {
    console.error("Falha ao registrar auditoria (não bloqueante):", erro);
  }
}
