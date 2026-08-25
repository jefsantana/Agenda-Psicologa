import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "./supabaseClient.js";
import { SELECT_ATENDIMENTO, mapearAtendimento } from "./atendimentosShared.js";

const STATUS_LABEL = {
  agendado: "Agendado",
  aguardando: "Aguardando",
  confirmado: "Confirmado",
  remarcar: "Remarcar",
  realizado: "Realizado",
  falta: "Falta",
  cancelado: "Cancelado",
};

export async function buscarAtendimentosFiltrados({ inicio, fim, convenioId, status }) {
  let query = supabase.from("atendimentos").select(SELECT_ATENDIMENTO).order("inicio", { ascending: false });

  if (inicio) query = query.gte("inicio", inicio);
  if (fim) query = query.lte("inicio", fim);
  if (convenioId) query = query.eq("convenio_id", convenioId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;

  return data.map((linha) => mapearAtendimento(linha, { convenioFallback: "Particular" }));
}

const CABECALHO = ["Data", "Hora", "Paciente", "Convênio", "Tipo", "Status", "Valor"];
const FORMATADOR_DATA = new Intl.DateTimeFormat("pt-BR");
const formatarHora = (d) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function linhasParaTabela(linhas) {
  return linhas.map((item) => [
    FORMATADOR_DATA.format(item.inicio),
    formatarHora(item.inicio),
    item.paciente,
    item.convenio,
    item.tipo === "online" ? "Online" : "Presencial",
    STATUS_LABEL[item.status] ?? item.status,
    item.valor != null ? Number(item.valor).toFixed(2).replace(".", ",") : "",
  ]);
}

function baixarArquivo(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportarPdf(linhas, nomeArquivo, periodo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont(undefined, "bold");
  doc.setFontSize(14);
  doc.text("Atendimentos", 14, 16);
  doc.setFont(undefined, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(90);
  doc.text(periodo, 14, 22);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 28,
    margin: { left: 14, right: 14 },
    head: [CABECALHO],
    body: linhasParaTabela(linhas),
    styles: { fontSize: 8.5, cellPadding: 2.2 },
    headStyles: { fillColor: [40, 35, 60], textColor: 255 },
  });

  doc.save(nomeArquivo);
}

/** Gera um .xls real (SpreadsheetML) — abre no Excel com colunas/tipos, sem precisar de biblioteca externa. */
export function exportarExcel(linhas, nomeArquivo) {
  const linhasTabela = [CABECALHO, ...linhasParaTabela(linhas)];

  const xmlLinhas = linhasTabela
    .map(
      (linha) =>
        `<Row>${linha.map((valor) => `<Cell><Data ss:Type="String">${escaparXml(valor)}</Data></Cell>`).join("")}</Row>`
    )
    .join("");

  const xml =
    `<?xml version="1.0"?>\n` +
    `<?mso-application progid="Excel.Sheet"?>\n` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n` +
    `<Worksheet ss:Name="Atendimentos"><Table>${xmlLinhas}</Table></Worksheet>\n` +
    `</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  baixarArquivo(blob, nomeArquivo);
}

function escaparXml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
