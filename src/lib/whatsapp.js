/** Limpa o telefone salvo e garante o código do Brasil (55) para o link do WhatsApp. */
export function numeroWhatsapp(telefone) {
  if (!telefone) return null;
  const digitos = telefone.replace(/\D/g, "");
  if (!digitos) return null;
  return digitos.startsWith("55") ? digitos : `55${digitos}`;
}

export function linkWhatsapp(telefone, mensagem) {
  const numero = numeroWhatsapp(telefone);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

const FORMATADOR_DATA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const FORMATADOR_HORA = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function modelosMensagem(nomePaciente, proximoAtendimento) {
  const primeiroNome = nomePaciente.split(" ")[0];
  const quandoTem = proximoAtendimento
    ? `em ${FORMATADOR_DATA.format(proximoAtendimento)} às ${FORMATADOR_HORA.format(proximoAtendimento)}`
    : null;

  const modelos = [
    {
      id: "livre",
      rotulo: "Mensagem livre",
      texto: `Olá, ${primeiroNome}! Aqui é a Dra. Raquel Frois.`,
    },
  ];

  if (quandoTem) {
    modelos.unshift(
      {
        id: "lembrete",
        rotulo: "Lembrete de consulta",
        texto: `Olá, ${primeiroNome}! Aqui é a Dra. Raquel Frois, passando para lembrar da sua consulta ${quandoTem}. Até lá!`,
      },
      {
        id: "confirmar",
        rotulo: "Confirmar consulta",
        texto: `Olá, ${primeiroNome}! Aqui é a Dra. Raquel Frois. Podemos confirmar sua consulta ${quandoTem}?`,
      }
    );
  }

  return modelos;
}
