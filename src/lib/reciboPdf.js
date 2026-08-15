import { jsPDF } from "jspdf";

export function gerarReciboPdf({ paciente, convenio, valor, dataAtendimento, pagoEm, forma, profissional }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largura = 210;
  const margem = 20;
  let y = 30;

  doc.setFont(undefined, "bold");
  doc.setFontSize(16);
  doc.text("RECIBO", largura / 2, y, { align: "center" });
  y += 14;

  doc.setFont(undefined, "normal");
  doc.setFontSize(11);
  const valorExtenso = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const paragrafo =
    `Recebi de ${paciente} a quantia de ${valorExtenso}, referente à sessão de psicoterapia ` +
    `realizada em ${new Date(dataAtendimento).toLocaleDateString("pt-BR")}` +
    (convenio && convenio !== "Particular" ? ` (convênio ${convenio})` : "") +
    `, paga em ${new Date(pagoEm).toLocaleDateString("pt-BR")}${forma ? ` via ${forma}` : ""}.`;

  const linhas = doc.splitTextToSize(paragrafo, largura - margem * 2);
  doc.text(linhas, margem, y);
  y += linhas.length * 6 + 20;

  doc.text(`${new Date().toLocaleDateString("pt-BR")}`, largura / 2, y, { align: "center" });
  y += 20;

  doc.line(largura / 2 - 40, y, largura / 2 + 40, y);
  doc.setFontSize(10);
  doc.text(profissional?.nome || "Assinatura do profissional", largura / 2, y + 5, { align: "center" });
  if (profissional?.crp) {
    doc.text(`CRP ${profissional.crp}`, largura / 2, y + 10, { align: "center" });
  }

  doc.save(`recibo_${slug(paciente)}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function slug(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
