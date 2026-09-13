const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const { DateTime } = require('luxon');
const cron = require('node-cron');

// ===================== CONFIGURAÇÃO =====================
const NOME_GRUPO_ALVO = process.env.NOME_GRUPO_ALVO || 'agenda';
const PORTA_HTTP = process.env.PORT || 8080;
const FUSO_HORARIO = process.env.FUSO_HORARIO || 'America/Sao_Paulo';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';

// ATENÇÃO (LGPD): o nome do paciente é a única informação de saúde que passa
// pela IA (pra identificar de qual atendimento se trata) — nenhum outro dado
// de prontuário é lido por este bot. Se ANTHROPIC_ONLY=true, os provedores
// gratuitos abaixo são ignorados e só a Anthropic é usada (mais previsível
// em termos de tratamento de dados, mais caro). Combine com a Raquel antes
// de ligar em produção qual política adotar.
const ANTHROPIC_ONLY = (process.env.ANTHROPIC_ONLY || '').toLowerCase() === 'true';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const GEMINI_API_KEYS = (process.env.GEMINI_API_KEY || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
// ==========================================================

if (!ANTHROPIC_API_KEY) console.warn('⚠️  ANTHROPIC_API_KEY não configurada.');
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) console.warn('⚠️  SUPABASE_URL / SUPABASE_SERVICE_KEY não configuradas.');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let jidGrupoAlvo = null;
let servidorHttpIniciado = false;
let socketAtual = null;

const mensagensJaProcessadas = new Set();
function jaProcessada(id) {
  if (!id) return false;
  if (mensagensJaProcessadas.has(id)) return true;
  mensagensJaProcessadas.add(id);
  if (mensagensJaProcessadas.size > 2000) mensagensJaProcessadas.clear();
  return false;
}

// ===================== Memória de conversa recente =====================
const HISTORICO_POR_REMETENTE = new Map();
const HISTORICO_MAX_ENTRADAS = 8;
const HISTORICO_VALIDADE_MS = 30 * 60 * 1000;

function registrarHistorico(jid, papel, texto) {
  if (!jid || !texto) return;
  const lista = HISTORICO_POR_REMETENTE.get(jid) || [];
  lista.push({ papel, texto, quando: Date.now() });
  while (lista.length > HISTORICO_MAX_ENTRADAS) lista.shift();
  HISTORICO_POR_REMETENTE.set(jid, lista);
}

function formatarHistorico(jid) {
  const lista = HISTORICO_POR_REMETENTE.get(jid);
  if (!lista || lista.length === 0) return null;
  const agora = Date.now();
  const recentes = lista.filter((m) => agora - m.quando <= HISTORICO_VALIDADE_MS);
  HISTORICO_POR_REMETENTE.set(jid, recentes);
  if (recentes.length === 0) return null;
  const linhas = recentes.map((m) => `[${m.papel === 'bot' ? 'bot' : 'pessoa'}]: ${m.texto}`).join('\n');
  return `Histórico recente da conversa com essa pessoa (mais antiga primeiro — só contexto, a mensagem atual é o que você precisa classificar agora):\n${linhas}`;
}

async function enviarNoGrupo(texto) {
  if (!socketAtual || !jidGrupoAlvo) {
    console.warn('⚠️  Não foi possível enviar mensagem: socket ou grupo indisponível.');
    return null;
  }
  return socketAtual.sendMessage(jidGrupoAlvo, { text: texto });
}

async function responder(chaveRemetente, texto) {
  const resultado = await enviarNoGrupo(texto);
  registrarHistorico(chaveRemetente, 'bot', texto);
  return resultado;
}

// ===================== IA: interpretar a mensagem =====================
const SYSTEM_PROMPT = `Você é o assistente de agenda do consultório da psicóloga Raquel Frois, usado pelo WhatsApp. A Raquel (ou quem estiver no grupo) manda mensagens pra organizar a agenda de atendimentos.

IMPORTANTE SOBRE DADOS SENSÍVEIS: você só recebe o NOME do paciente (pra identificar de qual atendimento se trata) — nunca prontuário, diagnóstico, ou qualquer outro dado clínico. Nunca invente ou repita informação clínica.

O sistema tem estas ações possíveis:

1. "agendar" — marcar um atendimento NOVO pra um paciente. Campos: nomePaciente, data (YYYY-MM-DD, resolvida a partir do que a pessoa disse — hoje é informado no contexto), hora (HH:mm, 24h), tipo ("online" ou "presencial"). Se a pessoa não disser o tipo, pergunte (não invente).
2. "reagendar" — mudar a DATA/HORA de um atendimento que já existe (ex: "remarca a consulta da Maria pra sexta às 15h", "muda o horário do João de amanhã pra 10h"). Campos: nomePaciente, novaData (YYYY-MM-DD), novaHora (HH:mm), referencia (opcional: uma pista de qual atendimento é, tipo "o de amanhã", "o de sexta", se o paciente tiver mais de um agendado).
3. "cancelar" — cancelar um atendimento já marcado (ex: "cancela a consulta da Maria de amanhã", "o João desmarcou"). Campos: nomePaciente, referencia (opcional, mesma ideia do item 2).
4. "confirmar" — confirmar presença de um atendimento já marcado (ex: "confirma a consulta da Maria de amanhã", "o João confirmou"). Campos: nomePaciente, referencia (opcional).
5. "excluir_atendimento" — REMOVER de vez um atendimento (diferente de cancelar: isso é só pra corrigir erro de digitação/duplicidade, não é uma cancelada de verdade pelo paciente — ex: "apaga esse agendamento, foi engano", "lancei duplicado, exclui um"). Campos: nomePaciente, referencia (opcional).
6. "consulta_agenda" — perguntar a agenda de um período ou de um paciente (ex: "agenda de hoje", "o que tenho amanhã", "quais consultas da Maria estão marcadas", "agenda da semana"). Campos: periodo ("hoje" | "amanha" | "semana") OU nomePaciente (um dos dois, não precisa dos dois).

Você recebe, antes da mensagem, um bloco de contexto dizendo a data de hoje e o dia da semana — use isso pra resolver "amanhã", "sexta", "semana que vem" etc. em datas reais (YYYY-MM-DD). NUNCA invente uma data se não conseguir resolver com confiança — nesse caso pergunte.

NUNCA invente um nome de paciente, data, hora ou tipo que não esteja claro na mensagem — se um campo obrigatório estiver faltando ou ambíguo, deixe null e explique o que falta em "faltando"/"pergunta".

Cadastro de paciente novo, edição de prontuário, edição de convênio e qualquer coisa que não seja marcar/mudar/cancelar/confirmar/excluir/consultar um atendimento NÃO são funções deste bot — se pedirem isso, classifique como não sendo uma transação (ehTransacao: false) e explique gentilmente na respostaCasual que isso só dá pra fazer pelo site.

Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, no formato:
{
  "ehTransacao": true ou false,
  "tipo": "agendar" | "reagendar" | "cancelar" | "confirmar" | "excluir_atendimento" | "consulta_agenda" | null,
  "nomePaciente": "nome como foi dito" ou null,
  "data": "YYYY-MM-DD" (agendar) ou null,
  "hora": "HH:mm" (agendar) ou null,
  "novaData": "YYYY-MM-DD" (reagendar) ou null,
  "novaHora": "HH:mm" (reagendar) ou null,
  "tipoAtendimento": "online" ou "presencial" (agendar) ou null,
  "referencia": "pista de qual atendimento, se houver mais de um" ou null,
  "periodo": "hoje" | "amanha" | "semana" (consulta_agenda) ou null,
  "comentario": "reação curta e profissional (máx 8 palavras) — só quando a ação foi concluída com sucesso" ou null,
  "faltando": ["nomes dos campos que ainda faltam"] (array vazio se completo),
  "pergunta": "pergunta curta e natural em português pedindo o que falta" ou null,
  "respostaCasual": "resposta breve e educada" (só quando ehTransacao for false) ou null
}

Mensagens do tipo consulta_agenda também devem ter ehTransacao: true.

Se a mensagem não for sobre agenda (cumprimento, pergunta não relacionada, pedido de algo que o bot não faz), retorne ehTransacao: false, demais campos null/vazio, faltando: [], pergunta: null, e preencha "respostaCasual" com uma resposta breve e educada.

Exemplos:
- "agenda a Maria Silva pra amanhã 14h, presencial" → tipo "agendar", nomePaciente "Maria Silva", data resolvida, hora "14:00", tipoAtendimento "presencial", faltando: [].
- "marca o João pra sexta 10h" (sem dizer online/presencial) → tipo "agendar", faltando: ["tipoAtendimento"], pergunta: "Vai ser online ou presencial?".
- "remarca a consulta da Maria pra quinta às 16h" → tipo "reagendar", nomePaciente "Maria", novaData resolvida, novaHora "16:00".
- "cancela a consulta de amanhã da Ana" → tipo "cancelar", nomePaciente "Ana", referencia "amanhã".
- "confirma o atendimento do Pedro" → tipo "confirmar", nomePaciente "Pedro".
- "o que eu tenho amanhã?" → tipo "consulta_agenda", periodo "amanha".
- "quais consultas a Maria tem marcadas" → tipo "consulta_agenda", nomePaciente "Maria".
- "cadastra um paciente novo" → ehTransacao: false, respostaCasual: "Cadastro de paciente novo é só pelo site por enquanto — tem vários campos do prontuário que não dá pra preencher por aqui. 😊".
- "bom dia" → ehTransacao: false, respostaCasual: "Bom dia! ☀️".`;

async function chamarAnthropic(contentBlocks, tentativa = 1) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: contentBlocks }],
    }),
  });

  if (!resp.ok) {
    const erro = await resp.text();
    throw new Error(`Anthropic API ${resp.status}: ${erro}`);
  }

  const data = await resp.json();
  const textoResposta = data.content?.find((b) => b.type === 'text')?.text || '';
  const jsonLimpo = textoResposta.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(jsonLimpo);
  } catch (err) {
    if (tentativa === 1) {
      console.warn('⚠️  Resposta da IA não veio em JSON válido, tentando de novo...');
      return chamarAnthropic(
        [
          ...contentBlocks,
          {
            type: 'text',
            text: `Sua resposta anterior não era um JSON válido:\n"${textoResposta}"\n\nResponda de novo, APENAS com o JSON pedido.`,
          },
        ],
        2
      );
    }
    throw new Error(`Resposta da IA não é um JSON válido mesmo após nova tentativa: ${textoResposta.slice(0, 200)}`);
  }
}

async function chamarGeminiComChave(contentBlocks, apiKey) {
  const parts = contentBlocks.filter((b) => b.type === 'text').map((b) => ({ text: b.text }));
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    }
  );
  if (!resp.ok) {
    const erro = await resp.text();
    throw new Error(`Gemini API ${resp.status}: ${erro}`);
  }
  const data = await resp.json();
  const textoResposta = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text || '';
  return JSON.parse(textoResposta.replace(/```json|```/g, '').trim());
}

async function chamarGemini(contentBlocks) {
  let ultimoErro;
  for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
    try {
      return await chamarGeminiComChave(contentBlocks, GEMINI_API_KEYS[i]);
    } catch (err) {
      ultimoErro = err;
      console.warn(`⚠️  Gemini (chave ${i + 1}/${GEMINI_API_KEYS.length}) falhou: ${err.message}`);
    }
  }
  throw ultimoErro || new Error('Nenhuma chave do Gemini configurada.');
}

async function chamarChatCompletions({ url, apiKey, model, contentBlocks }) {
  const textoUnico = contentBlocks
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n\n');
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: textoUnico },
      ],
    }),
  });
  if (!resp.ok) {
    const erro = await resp.text();
    throw new Error(`${url} ${resp.status}: ${erro}`);
  }
  const data = await resp.json();
  const textoResposta = data.choices?.[0]?.message?.content || '';
  return JSON.parse(textoResposta.replace(/```json|```/g, '').trim());
}

async function chamarGroq(contentBlocks) {
  return chamarChatCompletions({
    url: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: GROQ_API_KEY,
    model: GROQ_MODEL,
    contentBlocks,
  });
}

async function chamarMistral(contentBlocks) {
  return chamarChatCompletions({
    url: 'https://api.mistral.ai/v1/chat/completions',
    apiKey: MISTRAL_API_KEY,
    model: MISTRAL_MODEL,
    contentBlocks,
  });
}

async function chamarOpenAI(contentBlocks) {
  const content = contentBlocks.filter((b) => b.type === 'text').map((b) => ({ type: 'text', text: b.text }));
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
    }),
  });
  if (!resp.ok) {
    const erro = await resp.text();
    throw new Error(`OpenAI API ${resp.status}: ${erro}`);
  }
  const data = await resp.json();
  const textoResposta = data.choices?.[0]?.message?.content || '';
  return JSON.parse(textoResposta.replace(/```json|```/g, '').trim());
}

async function chamarIA(contentBlocks) {
  const todosProvedores = ANTHROPIC_ONLY
    ? [{ nome: 'Anthropic', chave: ANTHROPIC_API_KEY, fn: chamarAnthropic }]
    : [
        { nome: 'Gemini', chave: GEMINI_API_KEYS[0], fn: chamarGemini },
        { nome: 'Groq', chave: GROQ_API_KEY, fn: chamarGroq },
        { nome: 'Mistral', chave: MISTRAL_API_KEY, fn: chamarMistral },
        { nome: 'OpenAI', chave: OPENAI_API_KEY, fn: chamarOpenAI },
        { nome: 'Anthropic', chave: ANTHROPIC_API_KEY, fn: chamarAnthropic },
      ];
  const provedores = todosProvedores.filter((p) => p.chave);

  let ultimoErro;
  for (let i = 0; i < provedores.length; i++) {
    const provedor = provedores[i];
    try {
      const resultado = await provedor.fn(contentBlocks);
      console.log(`✅ Interpretado com ${provedor.nome}${i > 0 ? ' (fallback)' : ''}.`);
      return resultado;
    } catch (err) {
      console.warn(`⚠️  ${provedor.nome} falhou: ${err.message}`);
      ultimoErro = err;
    }
  }
  throw ultimoErro || new Error('Nenhum provedor de IA configurado.');
}

// Contexto de data — a IA nunca sabe "hoje" sozinha, então informamos sempre.
function contextoData() {
  const agora = DateTime.now().setZone(FUSO_HORARIO).setLocale('pt-BR');
  return `Hoje é ${agora.toFormat('yyyy-MM-dd')} (${agora.toFormat('cccc')}), agora são ${agora.toFormat('HH:mm')}.`;
}

async function interpretarMensagem(texto, remetente, chaveRemetente = null) {
  const blocos = [{ type: 'text', text: contextoData() }];
  const historico = chaveRemetente ? formatarHistorico(chaveRemetente) : null;
  if (historico) blocos.push({ type: 'text', text: historico });
  blocos.push({ type: 'text', text: `Mensagem de texto do WhatsApp (remetente: ${remetente}):\n"${texto}"` });
  return chamarIA(blocos);
}

async function continuarComResposta(dadosParciais, resposta, remetente, chaveRemetente = null) {
  const contexto =
    `Você estava marcando/alterando um atendimento e ainda faltava informação. Estado atual em JSON:\n${JSON.stringify(dadosParciais)}\n\n` +
    `Você perguntou: "${dadosParciais.pergunta}"\n` +
    `A pessoa (${remetente}) respondeu: "${resposta}"\n\n` +
    `PRIMEIRO decida: essa resposta responde à pergunta acima, ou é assunto novo (mudou de ideia, começou a falar de outro paciente)?\n` +
    `- Se FOR válida: atualize o JSON combinando com a resposta nova. Se ainda faltar algo, pergunte de novo. Se completo, faltando vazio, pergunta null.\n` +
    `- Se NÃO FOR relacionada: ignore o estado anterior e classifique "${resposta}" do zero.`;
  const blocos = [{ type: 'text', text: contextoData() }];
  const historico = chaveRemetente ? formatarHistorico(chaveRemetente) : null;
  if (historico) blocos.push({ type: 'text', text: historico });
  blocos.push({ type: 'text', text: contexto });
  return chamarIA(blocos);
}

// ===================== Pendências (perguntas em aberto) =====================
const VALIDADE_PENDENCIA_MS = 15 * 60 * 1000;

async function buscarPendencia(jid) {
  const { data, error } = await supabase
    .from('bot_pendencias_agenda')
    .select('*')
    .eq('jid', jid)
    .maybeSingle();
  if (error) {
    console.warn('Não foi possível buscar pendência:', error.message);
    return null;
  }
  if (!data) return null;
  if (Date.now() - new Date(data.criado_em).getTime() > VALIDADE_PENDENCIA_MS) {
    await apagarPendencia(jid);
    return null;
  }
  return data;
}

async function salvarPendencia(jid, dados) {
  const { error } = await supabase
    .from('bot_pendencias_agenda')
    .upsert({ jid, dados, criado_em: new Date().toISOString() }, { onConflict: 'jid' });
  if (error) console.error('Erro ao salvar pendência:', error.message);
}

async function apagarPendencia(jid) {
  const { error } = await supabase.from('bot_pendencias_agenda').delete().eq('jid', jid);
  if (error) console.error('Erro ao apagar pendência:', error.message);
}

// ===================== Pacientes =====================
// Busca por nome (ILIKE, sem acento-sensibilidade nativa — aceita substring).
// Retorna a lista de candidatos; quem chama decide o que fazer com 0/1/2+.
async function buscarPacientesPorNome(nome) {
  const { data, error } = await supabase
    .from('pacientes')
    .select('id, nome, status')
    .ilike('nome', `%${nome.trim()}%`)
    .order('nome');
  if (error) throw new Error(`Supabase select (pacientes): ${error.message}`);
  return data || [];
}

// Resolve um nome de paciente citado na mensagem pra um único paciente_id,
// ou retorna uma pergunta de esclarecimento se 0 ou 2+ baterem. Nunca
// assume — é exatamente o tipo de suposição que já causou bugs no bot
// financeiro quando o nome não batia exatamente com o cadastro.
async function resolverPaciente(nomeCitado) {
  const candidatos = await buscarPacientesPorNome(nomeCitado);
  if (candidatos.length === 0) {
    return {
      paciente: null,
      pergunta: `Não encontrei nenhum paciente chamado "${nomeCitado}" cadastrado. Pode confirmar o nome certo (como está cadastrado no sistema)?`,
    };
  }
  if (candidatos.length === 1) {
    return { paciente: candidatos[0], pergunta: null };
  }
  const nomes = candidatos.map((p) => p.nome).join(', ');
  return {
    paciente: null,
    pergunta: `Encontrei mais de um paciente com esse nome: ${nomes}. Pode confirmar o nome completo?`,
  };
}

// ===================== Atendimentos =====================
const STATUS_ABERTOS = ['agendado', 'aguardando', 'confirmado'];

async function buscarAtendimentosAbertosDoPaciente(pacienteId) {
  const { data, error } = await supabase
    .from('atendimentos')
    .select('*')
    .eq('paciente_id', pacienteId)
    .in('status', STATUS_ABERTOS)
    .gte('inicio', DateTime.now().setZone(FUSO_HORARIO).startOf('day').toISO())
    .order('inicio');
  if (error) throw new Error(`Supabase select (atendimentos): ${error.message}`);
  return data || [];
}

// Escolhe qual atendimento em aberto a mensagem se refere: só 1 em aberto =
// usa ele; 2+ tenta casar com a "referencia" citada (dia da semana/"amanhã"
// etc.) contra a data de cada um; se não conseguir decidir com confiança,
// pede pra pessoa confirmar em vez de chutar.
function escolherAtendimentoAlvo(atendimentos, referencia) {
  if (atendimentos.length === 0) return { atendimento: null, pergunta: 'não encontrei nenhum atendimento em aberto pra esse paciente' };
  if (atendimentos.length === 1) return { atendimento: atendimentos[0], pergunta: null };

  if (referencia) {
    const refNormalizada = referencia.trim().toLowerCase();
    const bateu = atendimentos.filter((a) => {
      const dt = DateTime.fromISO(a.inicio).setZone(FUSO_HORARIO).setLocale('pt-BR');
      const dataFmt = dt.toFormat('dd/MM');
      const diaSemana = dt.toFormat('cccc').toLowerCase();
      return refNormalizada.includes(dataFmt) || refNormalizada.includes(diaSemana) || diaSemana.includes(refNormalizada);
    });
    if (bateu.length === 1) return { atendimento: bateu[0], pergunta: null };
  }

  const lista = atendimentos
    .map((a) => {
      const dt = DateTime.fromISO(a.inicio).setZone(FUSO_HORARIO).setLocale('pt-BR');
      return `${dt.toFormat('dd/MM \'às\' HH:mm')} (${dt.toFormat('cccc')})`;
    })
    .join(', ');
  return { atendimento: null, pergunta: `Esse paciente tem mais de um atendimento em aberto: ${lista}. Qual deles?` };
}

async function buscarDuracaoPadrao(dataISO) {
  const diaSemana = DateTime.fromISO(dataISO).setZone(FUSO_HORARIO).weekday % 7; // luxon: 1=segunda..7=domingo -> 0=domingo..6=sabado
  const { data, error } = await supabase
    .from('configuracoes_agenda')
    .select('duracao_padrao_minutos')
    .eq('dia_semana', diaSemana)
    .maybeSingle();
  if (error || !data) return 50;
  return data.duracao_padrao_minutos || 50;
}

function formatarDataHora(iso) {
  return DateTime.fromISO(iso).setZone(FUSO_HORARIO).setLocale('pt-BR').toFormat("dd/MM 'às' HH:mm");
}

// Mensagem amigável quando duas consultas conflitam no mesmo horário — o
// próprio banco garante isso (exclusion constraint), então aqui só
// traduzimos o erro do Postgres pra algo legível.
function ehErroDeConflito(erro) {
  return erro && (erro.code === '23P01' || /exclu/i.test(erro.message || ''));
}

async function agendarAtendimento({ pacienteId, dataISO, horaISO, tipoAtendimento }) {
  const inicio = DateTime.fromISO(`${dataISO}T${horaISO}`, { zone: FUSO_HORARIO });
  const duracao = await buscarDuracaoPadrao(dataISO);
  const fim = inicio.plus({ minutes: duracao });

  const { data, error } = await supabase
    .from('atendimentos')
    .insert({
      paciente_id: pacienteId,
      inicio: inicio.toISO(),
      fim: fim.toISO(),
      tipo: tipoAtendimento,
      status: 'agendado',
    })
    .select()
    .single();

  if (error) {
    if (ehErroDeConflito(error)) throw new Error('CONFLITO_HORARIO');
    throw new Error(`Supabase insert (atendimentos): ${error.message}`);
  }
  return data;
}

async function reagendarAtendimento({ atendimentoId, dataISO, horaISO }) {
  const { data: atual, error: errBusca } = await supabase.from('atendimentos').select('*').eq('id', atendimentoId).single();
  if (errBusca) throw new Error(`Supabase select (atendimentos): ${errBusca.message}`);

  const duracaoOriginal = DateTime.fromISO(atual.fim).diff(DateTime.fromISO(atual.inicio), 'minutes').minutes;
  const novoInicio = DateTime.fromISO(`${dataISO}T${horaISO}`, { zone: FUSO_HORARIO });
  const novoFim = novoInicio.plus({ minutes: duracaoOriginal });

  // Reagendar invalida uma confirmação anterior — precisa reconfirmar pro
  // novo horário.
  const novoStatus = atual.status === 'confirmado' ? 'agendado' : atual.status;

  const { data, error } = await supabase
    .from('atendimentos')
    .update({ inicio: novoInicio.toISO(), fim: novoFim.toISO(), status: novoStatus, confirmado_em: null })
    .eq('id', atendimentoId)
    .select()
    .single();

  if (error) {
    if (ehErroDeConflito(error)) throw new Error('CONFLITO_HORARIO');
    throw new Error(`Supabase update (atendimentos): ${error.message}`);
  }
  return data;
}

async function atualizarStatus(atendimentoId, status) {
  const campos = { status };
  if (status === 'confirmado') campos.confirmado_em = new Date().toISOString();
  const { data, error } = await supabase.from('atendimentos').update(campos).eq('id', atendimentoId).select().single();
  if (error) throw new Error(`Supabase update (atendimentos): ${error.message}`);
  return data;
}

async function excluirAtendimento(atendimentoId) {
  const { error } = await supabase.from('atendimentos').delete().eq('id', atendimentoId);
  if (error) throw new Error(`Supabase delete (atendimentos): ${error.message}`);
}

// ===================== Consulta de agenda =====================
async function gerarAgendaPeriodo(periodo) {
  const agora = DateTime.now().setZone(FUSO_HORARIO);
  let inicio;
  let fim;
  let titulo;
  if (periodo === 'amanha') {
    inicio = agora.plus({ days: 1 }).startOf('day');
    fim = inicio.endOf('day');
    titulo = `Agenda de amanhã (${inicio.toFormat('dd/MM')})`;
  } else if (periodo === 'semana') {
    inicio = agora.startOf('day');
    fim = agora.plus({ days: 7 }).endOf('day');
    titulo = 'Agenda dos próximos 7 dias';
  } else {
    inicio = agora.startOf('day');
    fim = inicio.endOf('day');
    titulo = `Agenda de hoje (${inicio.toFormat('dd/MM')})`;
  }

  const { data, error } = await supabase
    .from('atendimentos')
    .select('*, pacientes(nome)')
    .gte('inicio', inicio.toISO())
    .lte('inicio', fim.toISO())
    .not('status', 'in', '(cancelado)')
    .order('inicio');
  if (error) throw new Error(`Supabase select (atendimentos): ${error.message}`);

  if (!data || data.length === 0) {
    return `📅 *${titulo}*\n\nNenhum atendimento marcado.`;
  }

  const linhas = data.map((a) => {
    const dt = DateTime.fromISO(a.inicio).setZone(FUSO_HORARIO).setLocale('pt-BR');
    const emoji = EMOJI_STATUS[a.status] || '📌';
    const dataLinha = periodo === 'semana' ? dt.toFormat("dd/MM cccc, HH:mm") : dt.toFormat('HH:mm');
    return `${emoji} ${dataLinha} — ${a.pacientes?.nome || 'Paciente'} (${a.tipo}) — ${ROTULO_STATUS[a.status] || a.status}`;
  });

  return `📅 *${titulo}*\n\n${linhas.join('\n')}`;
}

async function gerarAgendaPaciente(pacienteId, nomePaciente) {
  const atendimentos = await buscarAtendimentosAbertosDoPaciente(pacienteId);
  if (atendimentos.length === 0) {
    return `📅 *${nomePaciente}*\n\nNenhum atendimento em aberto.`;
  }
  const linhas = atendimentos.map((a) => {
    const emoji = EMOJI_STATUS[a.status] || '📌';
    return `${emoji} ${formatarDataHora(a.inicio)} — ${a.tipo} — ${ROTULO_STATUS[a.status] || a.status}`;
  });
  return `📅 *${nomePaciente}*\n\n${linhas.join('\n')}`;
}

const EMOJI_STATUS = {
  agendado: '🔵',
  aguardando: '🟡',
  confirmado: '🟢',
  realizado: '✅',
  falta: '🔴',
  cancelado: '⚪',
  remarcar: '🟠',
};
const ROTULO_STATUS = {
  agendado: 'agendado',
  aguardando: 'aguardando confirmação',
  confirmado: 'confirmado',
  realizado: 'realizado',
  falta: 'faltou',
  cancelado: 'cancelado',
  remarcar: 'remarcado',
};

// ===================== Tarefas agendadas =====================
// Todo dia às 18h: lembrete dos atendimentos de amanhã (mesmo espírito do
// aviso de "contas a vencer" do bot financeiro).
cron.schedule(
  '0 18 * * *',
  async () => {
    try {
      const texto = await gerarAgendaPeriodo('amanha');
      await enviarNoGrupo(`🔔 *Lembrete* — atendimentos de amanhã\n\n${texto.split('\n\n')[1] || 'Nenhum atendimento marcado.'}`);
      console.log('🔔 Lembrete de atendimentos de amanhã enviado.');
    } catch (err) {
      console.error('Erro ao enviar lembrete diário:', err.message);
    }
  },
  { timezone: FUSO_HORARIO }
);

// A cada minuto: avisa 10 minutos antes de cada atendimento em aberto.
// bot_lembretes_enviados evita reenviar o mesmo lembrete (ex: se o bot
// reiniciar bem na janela do minuto certo).
cron.schedule(
  '* * * * *',
  async () => {
    try {
      const agora = DateTime.now().setZone(FUSO_HORARIO);
      const inicioJanela = agora.plus({ minutes: 10 }).startOf('minute');
      const fimJanela = inicioJanela.plus({ minutes: 1 });

      const { data: atendimentos, error } = await supabase
        .from('atendimentos')
        .select('id, inicio, tipo, pacientes(nome)')
        .in('status', STATUS_ABERTOS)
        .gte('inicio', inicioJanela.toISO())
        .lt('inicio', fimJanela.toISO());
      if (error) throw new Error(error.message);
      if (!atendimentos || atendimentos.length === 0) return;

      for (const atendimento of atendimentos) {
        const { data: jaEnviado, error: erroCheck } = await supabase
          .from('bot_lembretes_enviados')
          .select('atendimento_id')
          .eq('atendimento_id', atendimento.id)
          .maybeSingle();
        if (erroCheck) {
          console.error('Erro ao checar lembrete já enviado:', erroCheck.message);
          continue;
        }
        if (jaEnviado) continue;

        const hora = DateTime.fromISO(atendimento.inicio).setZone(FUSO_HORARIO).toFormat('HH:mm');
        const nomePaciente = atendimento.pacientes?.nome || 'paciente';
        await enviarNoGrupo(`🔔 *Lembrete* — ${nomePaciente} em 10 minutos (${hora}) — ${atendimento.tipo}.`);

        const { error: erroInsert } = await supabase
          .from('bot_lembretes_enviados')
          .insert({ atendimento_id: atendimento.id });
        if (erroInsert) console.error('Erro ao registrar lembrete enviado:', erroInsert.message);

        console.log(`🔔 Lembrete de 10min enviado: ${nomePaciente} às ${hora}.`);
      }
    } catch (err) {
      console.error('Erro ao verificar lembretes de 10 minutos:', err.message);
    }
  },
  { timezone: FUSO_HORARIO }
);

// ===================== Baileys: conexão com o WhatsApp =====================
async function iniciar() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({ auth: state, printQRInTerminal: false, markOnlineOnConnect: false });
  socketAtual = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Escaneie este QR Code no WhatsApp (Aparelhos conectados):\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const motivo = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const foiDeslogado = motivo === DisconnectReason.loggedOut;
      console.log('Conexão encerrada.', motivo, 'Deslogado?', foiDeslogado);

      if (foiDeslogado) {
        console.log('Sessão inválida — limpando credenciais e reiniciando pareamento automaticamente.');
        try {
          const fs = require('fs');
          fs.rmSync('auth_info_baileys', { recursive: true, force: true });
        } catch (e) {
          console.error('Erro ao limpar sessão antiga:', e.message);
        }
      }
      iniciar();
    } else if (connection === 'open') {
      console.log('✅ Conectado ao WhatsApp com sucesso!');
      try {
        await sock.sendPresenceUpdate('unavailable');
      } catch (e) {
        console.warn('Não foi possível marcar presença como indisponível:', e.message);
      }
      resolverGrupoAlvo(sock);
      if (!servidorHttpIniciado) {
        iniciarServidorHttp();
        servidorHttpIniciado = true;
      }
    }
  });

  async function resolverGrupoAlvo(sock) {
    try {
      const grupos = await sock.groupFetchAllParticipating();
      const encontrado = Object.values(grupos).find(
        (g) => g.subject?.trim().toLowerCase() === NOME_GRUPO_ALVO.trim().toLowerCase()
      );
      if (encontrado) {
        jidGrupoAlvo = encontrado.id;
        console.log(`🎯 Grupo "${NOME_GRUPO_ALVO}" localizado: ${jidGrupoAlvo}`);
      } else {
        console.warn(`⚠️  Grupo "${NOME_GRUPO_ALVO}" não encontrado.`);
      }
    } catch (err) {
      console.error('Erro ao buscar grupos:', err.message);
    }
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        await processarMensagem(sock, msg);
      } catch (err) {
        console.error('Erro ao processar mensagem:', err.message);
      }
    }
  });

  async function processarMensagem(sock, msg) {
    if (!msg.message) return;
    if (jaProcessada(msg.key.id)) return;

    const remetenteJid = msg.key.remoteJid;
    if (!jidGrupoAlvo || remetenteJid !== jidGrupoAlvo) return;

    const nomeRemetente = msg.pushName || 'Desconhecido';
    const chaveRemetente = msg.key.participant || remetenteJid;
    const tipoMsg = Object.keys(msg.message)[0];
    const ehTexto = tipoMsg === 'conversation' || tipoMsg === 'extendedTextMessage';
    if (!ehTexto) return;

    const texto = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
    if (!texto) return;

    let dados;
    const pendente = await buscarPendencia(chaveRemetente);
    if (pendente) {
      if (/^cancela(r)?$/i.test(texto)) {
        await apagarPendencia(chaveRemetente);
        registrarHistorico(chaveRemetente, 'usuario', texto);
        await responder(chaveRemetente, 'Ok, cancelado.');
        return;
      }
      try {
        dados = await continuarComResposta(pendente.dados, texto, nomeRemetente, chaveRemetente);
        registrarHistorico(chaveRemetente, 'usuario', texto);
        await apagarPendencia(chaveRemetente);
      } catch (err) {
        console.error('Erro ao continuar pendência:', err.message);
        await responder(chaveRemetente, '🤔 Não entendi. Pode tentar de novo, com outras palavras?');
        return;
      }
    } else {
      try {
        dados = await interpretarMensagem(texto, nomeRemetente, chaveRemetente);
        registrarHistorico(chaveRemetente, 'usuario', texto);
      } catch (err) {
        console.error('Erro ao chamar a IA:', err.message);
        await responder(chaveRemetente, '🤔 Não consegui entender essa mensagem. Pode reformular?');
        return;
      }
    }

    if (!dados.ehTransacao) {
      await responder(chaveRemetente, dados.respostaCasual || 'Oi! 😊');
      return;
    }

    if (dados.faltando && dados.faltando.length > 0) {
      await salvarPendencia(chaveRemetente, dados);
      if (dados.pergunta) await responder(chaveRemetente, dados.pergunta);
      return;
    }

    try {
      await executarAcao(dados, chaveRemetente);
    } catch (err) {
      console.error('Erro ao executar ação de agenda:', err.message);
      await responder(chaveRemetente, '⚠️ Entendi o pedido, mas tive um problema ao processar. Pode tentar de novo?');
    }
  }

  async function executarAcao(dados, chaveRemetente) {
    // "consulta_agenda" por período não precisa de paciente.
    if (dados.tipo === 'consulta_agenda' && !dados.nomePaciente) {
      const texto = await gerarAgendaPeriodo(dados.periodo || 'hoje');
      await responder(chaveRemetente, texto);
      return;
    }

    // Todas as outras ações precisam identificar o paciente primeiro.
    const { paciente, pergunta: perguntaPaciente } = await resolverPaciente(dados.nomePaciente);
    if (!paciente) {
      await salvarPendencia(chaveRemetente, { ...dados, faltando: ['nomePaciente'], pergunta: perguntaPaciente });
      await responder(chaveRemetente, perguntaPaciente);
      return;
    }

    if (dados.tipo === 'consulta_agenda') {
      await responder(chaveRemetente, await gerarAgendaPaciente(paciente.id, paciente.nome));
      return;
    }

    if (dados.tipo === 'agendar') {
      try {
        await agendarAtendimento({
          pacienteId: paciente.id,
          dataISO: dados.data,
          horaISO: dados.hora,
          tipoAtendimento: dados.tipoAtendimento,
        });
        await responder(
          chaveRemetente,
          `✅ *Atendimento agendado!*\n👤 ${paciente.nome}\n📅 ${formatarDataHora(`${dados.data}T${dados.hora}`)}\n💻 ${dados.tipoAtendimento}`
        );
      } catch (err) {
        if (err.message === 'CONFLITO_HORARIO') {
          await responder(chaveRemetente, `⚠️ Esse horário já está ocupado por outro atendimento. Pode escolher outro horário?`);
          return;
        }
        throw err;
      }
      return;
    }

    // Reagendar/cancelar/confirmar/excluir precisam achar QUAL atendimento.
    const atendimentosAbertos = await buscarAtendimentosAbertosDoPaciente(paciente.id);
    const { atendimento, pergunta: perguntaAtendimento } = escolherAtendimentoAlvo(atendimentosAbertos, dados.referencia);
    if (!atendimento) {
      await responder(chaveRemetente, `🤔 Sobre ${paciente.nome}: ${perguntaAtendimento}.`);
      return;
    }

    if (dados.tipo === 'reagendar') {
      try {
        const atualizado = await reagendarAtendimento({
          atendimentoId: atendimento.id,
          dataISO: dados.novaData,
          horaISO: dados.novaHora,
        });
        await responder(
          chaveRemetente,
          `✅ *Atendimento remarcado!*\n👤 ${paciente.nome}\n📅 Novo horário: ${formatarDataHora(atualizado.inicio)}`
        );
      } catch (err) {
        if (err.message === 'CONFLITO_HORARIO') {
          await responder(chaveRemetente, `⚠️ Esse novo horário já está ocupado por outro atendimento. Pode escolher outro?`);
          return;
        }
        throw err;
      }
      return;
    }

    if (dados.tipo === 'cancelar') {
      await atualizarStatus(atendimento.id, 'cancelado');
      await responder(chaveRemetente, `✅ Atendimento de *${paciente.nome}* (${formatarDataHora(atendimento.inicio)}) cancelado.`);
      return;
    }

    if (dados.tipo === 'confirmar') {
      await atualizarStatus(atendimento.id, 'confirmado');
      await responder(chaveRemetente, `✅ Atendimento de *${paciente.nome}* (${formatarDataHora(atendimento.inicio)}) confirmado.`);
      return;
    }

    if (dados.tipo === 'excluir_atendimento') {
      const dataHoraExcluida = formatarDataHora(atendimento.inicio);
      await excluirAtendimento(atendimento.id);
      await responder(chaveRemetente, `🗑️ Atendimento de *${paciente.nome}* (${dataHoraExcluida}) excluído permanentemente.`);
      return;
    }

    console.warn(`⚠️  Tipo não suportado retornado pela IA: ${JSON.stringify(dados.tipo)}`);
    await responder(chaveRemetente, '🤔 Entendi que é sobre a agenda, mas essa ação ainda não é uma função que eu sei fazer.');
  }
}

// ===================== Servidor HTTP (healthcheck) =====================
function iniciarServidorHttp() {
  const app = express();
  app.get('/status', (req, res) => {
    res.json({ conectado: !!socketAtual, grupoLocalizado: !!jidGrupoAlvo, grupo: NOME_GRUPO_ALVO });
  });
  app.listen(PORTA_HTTP, () => {
    console.log(`🌐 Servidor HTTP ouvindo na porta ${PORTA_HTTP}`);
  });
}

iniciar().catch((err) => console.error('Erro fatal ao iniciar:', err));
