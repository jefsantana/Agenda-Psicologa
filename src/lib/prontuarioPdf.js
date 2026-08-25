import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MARGEM = 14;
const LARGURA_PAGINA = 210;
const ALTURA_PAGINA = 297;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;

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

const CONTEUDO_X = MARGEM + 4;
const CONTEUDO_LARGURA = LARGURA_UTIL - 8;

// Ritmo vertical único usado em todo o documento — evita espaçamentos
// diferentes de um campo para outro.
const ALTURA_LINHA = 4.6; // altura de uma linha de texto (fonte 9.5)
const ESPACO_ENTRE_CAMPOS = 2.2; // respiro entre um campo e o próximo
const ESPACO_ENTRE_SECOES = 5; // respiro entre blocos de campos distintos

export function gerarPdfProntuario({ paciente, prontuario, historico }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGEM;

  // Caixa superior com o nome da profissional (no lugar do logo da clínica).
  const alturaCaixaTopo = 18;
  doc.setDrawColor(0);
  doc.rect(MARGEM, y, LARGURA_UTIL, alturaCaixaTopo);

  doc.setFont(undefined, "bold");
  doc.setFontSize(15);
  doc.text("Raquel Fróis", LARGURA_PAGINA / 2, y + 9, { align: "center" });
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  doc.text("Psicóloga Clínica · CRP 04/62962", LARGURA_PAGINA / 2, y + 14.5, { align: "center" });

  y += alturaCaixaTopo + ESPACO_ENTRE_SECOES;

  doc.setFont(undefined, "bold");
  doc.setFontSize(9.5);
  doc.text("PSICOLOGIA E TERAPIAS INTEGRADAS", LARGURA_PAGINA / 2, y, { align: "center" });
  doc.setFont(undefined, "normal");
  y += ESPACO_ENTRE_SECOES;

  const inicioCaixaPrincipal = y;
  y += ESPACO_ENTRE_SECOES + 3;

  doc.setFont(undefined, "bold");
  doc.setFontSize(13);
  doc.text("PRONTUÁRIO DE ATENDIMENTO", LARGURA_PAGINA / 2, y, { align: "center" });
  doc.setFont(undefined, "normal");
  y += ESPACO_ENTRE_SECOES + 3;

  y = linhaCampoUnico(doc, y, "Nome do paciente", paciente.nome);
  y = linhaCampos(doc, y, [
    ["Data de nascimento", formatarData(paciente.nascimento)],
    ["Idade", paciente.nascimento ? `${calcularIdade(paciente.nascimento)} anos` : "—"],
    ["Sexo", paciente.sexo || "—"],
    ["Estado civil", paciente.estado_civil || "—"],
  ]);
  y = linhaCampoUnico(doc, y, "Filiação", paciente.filiacao);
  y = linhaCampos(doc, y, [
    ["Escolaridade", paciente.escolaridade || "—"],
    ["Profissão", paciente.profissao || "—"],
  ]);
  y = linhaCampos(doc, y, [
    ["RG", paciente.rg || "—"],
    ["CPF", paciente.cpf || "—"],
  ]);
  y = linhaCampoUnico(doc, y, "Endereço", paciente.endereco);
  y = linhaCampoUnico(
    doc,
    y,
    "Contato",
    [paciente.telefone, paciente.email].filter(Boolean).join(" · ")
  );
  y = linhaCampoUnico(doc, y, "Início da terapia", formatarData(paciente.data_inicio_terapia));

  // Cada campo já devolve y com ESPACO_ENTRE_CAMPOS aplicado; completa até
  // ESPACO_ENTRE_SECOES para abrir um respiro maior antes do próximo bloco.
  y += ESPACO_ENTRE_SECOES - ESPACO_ENTRE_CAMPOS;
  y = campoLongoCaixa(doc, y, "Motivo da consulta / Queixa / CID", prontuario.motivo_consulta);
  y = campoLongoCaixa(doc, y, "Encaminhado por algum profissional? Por qual motivo?", prontuario.encaminhado_por);
  y = campoLongoCaixa(doc, y, "Avaliação e objetivo terapêutico", prontuario.avaliacao_objetivo);

  y += ESPACO_ENTRE_SECOES - ESPACO_ENTRE_CAMPOS;
  doc.setDrawColor(160);
  doc.line(CONTEUDO_X, y, CONTEUDO_X + CONTEUDO_LARGURA, y);
  doc.setDrawColor(0);
  y += ESPACO_ENTRE_SECOES;

  const motivoTermino = prontuario.motivo_termino;
  y = linhaCampos(doc, y, [
    ["Término da terapia", formatarData(prontuario.data_termino_terapia)],
    ["Motivo", `(${motivoTermino === "desistente" ? "X" : " "}) Desistente  (${motivoTermino === "concluido" ? "X" : " "}) Concluído`],
  ]);

  y += ESPACO_ENTRE_SECOES;
  doc.setDrawColor(0);
  doc.rect(MARGEM, inicioCaixaPrincipal, LARGURA_UTIL, y - inicioCaixaPrincipal);

  y += ESPACO_ENTRE_SECOES + 3;
  if (y > ALTURA_PAGINA - 40) {
    doc.addPage();
    y = MARGEM;
  }

  const tipoProfissional = prontuario.tipo_profissional;
  doc.setFontSize(9.5);
  const marcador = (chave) => (tipoProfissional === chave ? "X" : " ");
  const linhaProfissional =
    `Profissional responsável pelo atendimento: ` +
    `(${marcador("psicologo")}) Psicólogo  (${marcador("to")}) T.O.  (${marcador("fonoaudiologo")}) Fonoaudiólogo  ` +
    `(${marcador("fisioterapeuta")}) Fisioterapeuta  (${marcador("outro")}) ${tipoProfissional === "outro" ? "Outro" : ""}`;
  const linhasProfissional = doc.splitTextToSize(linhaProfissional, LARGURA_UTIL);
  doc.text(linhasProfissional, MARGEM, y);
  y += linhasProfissional.length * ALTURA_LINHA + ESPACO_ENTRE_CAMPOS;

  y = linhaCampoUnico(doc, y, "Nome", prontuario.nome_profissional);
  y = linhaCampoUnico(doc, y, "Nº Conselho", prontuario.numero_conselho);

  y += ESPACO_ENTRE_SECOES * 2;
  if (y > ALTURA_PAGINA - 30) {
    doc.addPage();
    y = MARGEM;
  }
  const larguraAssinatura = 80;
  const xAssinatura = LARGURA_PAGINA - MARGEM - larguraAssinatura;
  doc.setDrawColor(120);
  doc.line(xAssinatura, y, xAssinatura + larguraAssinatura, y);
  doc.setFontSize(8.5);
  doc.setTextColor(90);
  doc.text("Assinatura e carimbo profissional", xAssinatura + larguraAssinatura / 2, y + 4, { align: "center" });
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

/** Uma linha "Label: valor" ocupando a largura do conteúdo, quebrando se for longa. */
function linhaCampoUnico(doc, y, label, valor) {
  doc.setFontSize(9.5);
  doc.setFont(undefined, "bold");
  const rotulo = `${label}: `;
  doc.text(rotulo, CONTEUDO_X, y);
  const larguraRotulo = doc.getTextWidth(rotulo);
  doc.setFont(undefined, "normal");
  const linhas = doc.splitTextToSize(String(valor?.toString().trim() ? valor : "—"), CONTEUDO_LARGURA - larguraRotulo);
  doc.text(linhas[0] ?? "—", CONTEUDO_X + larguraRotulo, y);
  for (let i = 1; i < linhas.length; i++) {
    doc.text(linhas[i], CONTEUDO_X, y + i * ALTURA_LINHA);
  }
  return y + linhas.length * ALTURA_LINHA + ESPACO_ENTRE_CAMPOS;
}

/** Vários pares "Label: valor" lado a lado na mesma linha. */
function linhaCampos(doc, y, pares) {
  doc.setFontSize(9.5);
  let x = CONTEUDO_X;
  for (const [label, valor] of pares) {
    doc.setFont(undefined, "bold");
    const rotulo = `${label}: `;
    doc.text(rotulo, x, y);
    x += doc.getTextWidth(rotulo);
    doc.setFont(undefined, "normal");
    const texto = String(valor ?? "—");
    doc.text(texto, x, y);
    x += doc.getTextWidth(texto) + 8;
  }
  return y + ALTURA_LINHA + ESPACO_ENTRE_CAMPOS;
}

/** Campo de texto longo (múltiplas linhas), respeitando a caixa do prontuário. */
function campoLongoCaixa(doc, y, label, valor) {
  doc.setFontSize(9.5);
  doc.setFont(undefined, "bold");
  doc.text(`${label}:`, CONTEUDO_X, y);
  doc.setFont(undefined, "normal");
  const linhas = doc.splitTextToSize(valor?.trim() ? valor : "—", CONTEUDO_LARGURA);
  doc.text(linhas, CONTEUDO_X, y + ALTURA_LINHA);
  return y + ALTURA_LINHA * (1 + linhas.length) + ESPACO_ENTRE_CAMPOS;
}

function slug(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
