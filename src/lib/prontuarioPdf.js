import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MARGEM = 14;
const LARGURA_PAGINA = 210;
const ALTURA_PAGINA = 297;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;

const TIPO_PROFISSIONAL_LABEL = {
  psicologo: "Psicólogo(a)",
  to: "Terapeuta Ocupacional",
  fonoaudiologo: "Fonoaudiólogo(a)",
  fisioterapeuta: "Fisioterapeuta",
  outro: "Outro",
};

const MOTIVO_TERMINO_LABEL = { desistente: "Desistente", concluido: "Concluído" };

function calcularIdade(nascimentoISO) {
  if (!nascimentoISO) return null;
  const nascimento = new Date(`${nascimentoISO}T00:00:00`);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

function formatarData(iso) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

const TIPO_ATENDIMENTO_LABEL = { online: "Online", presencial: "Presencial" };
const STATUS_ATENDIMENTO_LABEL = {
  agendado: "Agendado",
  aguardando: "Aguardando",
  confirmado: "Confirmado",
  remarcar: "Remarcar",
  realizado: "Realizado",
  falta: "Falta",
  cancelado: "Cancelado",
};

export function gerarPdfProntuario({ paciente, prontuario, historico }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGEM;

  y = titulo(doc, "PRONTUÁRIO DE ATENDIMENTO", y);
  y += 4;

  y = subtitulo(doc, "Dados do paciente", y);
  y = duasColunas(doc, y, [
    ["Nome do paciente", paciente.nome],
    ["Data de nascimento", formatarData(paciente.nascimento)],
    ["Idade", paciente.nascimento ? `${calcularIdade(paciente.nascimento)} anos` : "—"],
    ["Sexo", paciente.sexo || "—"],
    ["Estado civil", paciente.estado_civil || "—"],
    ["Filiação", paciente.filiacao || "—"],
    ["Escolaridade", paciente.escolaridade || "—"],
    ["Profissão", paciente.profissao || "—"],
    ["RG", paciente.rg || "—"],
    ["CPF", paciente.cpf || "—"],
    ["Endereço", paciente.endereco || "—"],
    ["Contato", [paciente.telefone, paciente.email].filter(Boolean).join(" · ") || "—"],
    ["Início da terapia", formatarData(paciente.data_inicio_terapia)],
  ]);

  y += 2;
  y = subtitulo(doc, "Avaliação clínica", y);
  y = campoLongo(doc, y, "Motivo da consulta / Queixa / CID", prontuario.motivo_consulta);
  y = campoLongo(doc, y, "Encaminhado por", prontuario.encaminhado_por);
  y = campoLongo(doc, y, "Avaliação e objetivo terapêutico", prontuario.avaliacao_objetivo);

  if (prontuario.data_termino_terapia || prontuario.motivo_termino) {
    y = duasColunas(doc, y, [
      ["Data de término da terapia", formatarData(prontuario.data_termino_terapia)],
      ["Motivo do término", MOTIVO_TERMINO_LABEL[prontuario.motivo_termino] ?? "—"],
    ]);
  }

  y += 2;
  y = subtitulo(doc, "Profissional responsável pelo atendimento", y);
  y = duasColunas(doc, y, [
    ["Tipo de profissional", TIPO_PROFISSIONAL_LABEL[prontuario.tipo_profissional] ?? "—"],
    ["Nome do profissional", prontuario.nome_profissional || "—"],
    ["Nº do Conselho", prontuario.numero_conselho || "—"],
  ]);

  y += 14;
  if (y > ALTURA_PAGINA - 40) {
    doc.addPage();
    y = MARGEM;
  }
  doc.setDrawColor(120);
  doc.line(MARGEM, y, MARGEM + 80, y);
  doc.setFontSize(8.5);
  doc.setTextColor(90);
  doc.text("Assinatura e carimbo profissional", MARGEM, y + 4);
  doc.setTextColor(0);

  // Tabela de atendimentos — sempre começa numa página nova para ficar legível.
  doc.addPage();
  y = MARGEM;
  y = titulo(doc, "HISTÓRICO DE ATENDIMENTOS", y, 12);
  y += 4;

  const linhas =
    historico.length > 0
      ? historico.map((item) => [
          item.inicio.toLocaleDateString("pt-BR"),
          item.inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          TIPO_ATENDIMENTO_LABEL[item.tipo] ?? item.tipo,
          STATUS_ATENDIMENTO_LABEL[item.status] ?? item.status,
        ])
      : [["—", "—", "—", "Nenhum atendimento registrado ainda."]];

  autoTable(doc, {
    startY: y,
    margin: { left: MARGEM, right: MARGEM },
    head: [["Data", "Horário", "Tipo", "Status"]],
    body: linhas,
    styles: { fontSize: 9.5, cellPadding: 2.4, valign: "top" },
    headStyles: { fillColor: [40, 35, 60], textColor: 255 },
    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 24 } },
  });

  const nomeArquivo = `prontuario_${slug(paciente.nome)}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArquivo);
}

function titulo(doc, texto, y, tamanho = 14) {
  doc.setFont(undefined, "bold");
  doc.setFontSize(tamanho);
  doc.text(texto, LARGURA_PAGINA / 2, y, { align: "center" });
  doc.setFont(undefined, "normal");
  return y + 6;
}

function subtitulo(doc, texto, y) {
  if (y > ALTURA_PAGINA - 30) {
    doc.addPage();
    y = MARGEM;
  }
  doc.setFont(undefined, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(60, 50, 90);
  doc.text(texto.toUpperCase(), MARGEM, y);
  doc.setTextColor(0);
  doc.setFont(undefined, "normal");
  doc.setDrawColor(200);
  doc.line(MARGEM, y + 1.5, LARGURA_PAGINA - MARGEM, y + 1.5);
  return y + 7;
}

/** Pares label/valor em duas colunas, quebrando de linha automaticamente. */
function duasColunas(doc, y, pares) {
  const larguraColuna = LARGURA_UTIL / 2;
  doc.setFontSize(9.5);

  for (let i = 0; i < pares.length; i += 2) {
    if (y > ALTURA_PAGINA - MARGEM) {
      doc.addPage();
      y = MARGEM;
    }
    const linhaAltura = escreverCampo(doc, pares[i], MARGEM, y, larguraColuna - 4);
    let alturaDireita = 0;
    if (pares[i + 1]) {
      alturaDireita = escreverCampo(doc, pares[i + 1], MARGEM + larguraColuna, y, larguraColuna - 4);
    }
    y += Math.max(linhaAltura, alturaDireita) + 3;
  }
  return y;
}

function escreverCampo(doc, [label, valor], x, y, largura) {
  doc.setFont(undefined, "bold");
  doc.text(`${label}:`, x, y);
  doc.setFont(undefined, "normal");
  const linhas = doc.splitTextToSize(String(valor ?? "—"), largura);
  doc.text(linhas, x, y + 4.2);
  return 4.2 + linhas.length * 4;
}

function campoLongo(doc, y, label, valor) {
  if (y > ALTURA_PAGINA - 30) {
    doc.addPage();
    y = MARGEM;
  }
  doc.setFontSize(9.5);
  doc.setFont(undefined, "bold");
  doc.text(`${label}:`, MARGEM, y);
  doc.setFont(undefined, "normal");
  const linhas = doc.splitTextToSize(valor?.trim() ? valor : "—", LARGURA_UTIL);
  doc.text(linhas, MARGEM, y + 4.2);
  return y + 4.2 + linhas.length * 4.2 + 3;
}

function slug(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
