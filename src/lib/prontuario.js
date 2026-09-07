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

/** Linha do tempo de presença do paciente (aba "Histórico" do prontuário). */
export async function buscarHistoricoAtendimentos(pacienteId) {
  const { data, error } = await supabase
    .from("atendimentos")
    .select("id, inicio, tipo, status")
    .eq("paciente_id", pacienteId)
    .order("inicio", { ascending: false });
  if (error) throw error;
  return data.map((linha) => ({ ...linha, inicio: new Date(linha.inicio) }));
}

/**
 * Fila de evolução entre todos os pacientes — separa atendimentos realizados
 * em "a escrever" (sem evolução registrada ainda) e "assinados" (já têm ao
 * menos uma versão salva). Base da tela de Prontuários (worklist).
 */
export async function buscarFilaDeEvolucoes() {
  const { data: atendimentos, error: erroAtendimentos } = await supabase
    .from("atendimentos")
    .select("id, inicio, paciente_id, paciente:pacientes(nome)")
    .eq("status", "realizado")
    .order("inicio", { ascending: true });
  if (erroAtendimentos) throw erroAtendimentos;
  if (atendimentos.length === 0) return { aEscrever: [], assinados: [] };

  const ids = atendimentos.map((a) => a.id);
  const { data: evolucoes, error: erroEvolucoes } = await supabase
    .from("evolucoes")
    .select("atendimento_id, conteudo, criado_em")
    .in("atendimento_id", ids)
    .order("criado_em", { ascending: false });
  if (erroEvolucoes) throw erroEvolucoes;

  const evolucaoPorAtendimento = new Map();
  for (const evolucao of evolucoes) {
    if (!evolucaoPorAtendimento.has(evolucao.atendimento_id)) evolucaoPorAtendimento.set(evolucao.atendimento_id, evolucao);
  }

  const aEscrever = [];
  const assinados = [];
  for (const atendimento of atendimentos) {
    const evolucao = evolucaoPorAtendimento.get(atendimento.id);
    const item = {
      id: atendimento.id,
      inicio: new Date(atendimento.inicio),
      pacienteId: atendimento.paciente_id,
      paciente: atendimento.paciente?.nome ?? "Paciente removido",
    };
    if (evolucao) {
      assinados.push({ ...item, resumoEvolucao: resumirTexto(evolucao.conteudo), atualizadoEm: new Date(evolucao.criado_em) });
    } else {
      aEscrever.push(item);
    }
  }

  assinados.sort((a, b) => b.atualizadoEm - a.atualizadoEm);
  return { aEscrever, assinados };
}

function resumirTexto(texto) {
  if (!texto) return null;
  const limpo = texto.trim();
  return limpo.length > 90 ? `${limpo.slice(0, 90)}…` : limpo;
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
