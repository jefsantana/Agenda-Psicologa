import { jsPDF } from "jspdf";

const FORMATADOR_MOEDA = (valor) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function gerarRelatorioMensalPdf({ mesRotulo, fechamento, profissional }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const largura = 210;
  const margem = 20;
  let y = 25;

  doc.setFont(undefined, "bold");
  doc.setFontSize(16);
  doc.text(`Fechamento mensal — ${mesRotulo}`, largura / 2, y, { align: "center" });
  y += 8;

  doc.setFont(undefined, "normal");
  doc.setFontSize(10);
  if (profissional?.nome) {
    const linha = profissional.crp ? `${profissional.nome} · CRP ${profissional.crp}` : profissional.nome;
    doc.text(linha, largura / 2, y, { align: "center" });
    y += 12;
  } else {
    y += 6;
  }

  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.text("Resumo do mês", margem, y);
  y += 7;

  doc.setFont(undefined, "normal");
  doc.setFontSize(10.5);
  const { sessoes } = fechamento;
  const linhasResumo = [
    `Sessões realizadas: ${sessoes.realizadas}`,
    `Faltas: ${sessoes.faltas}`,
    `Remarcações: ${sessoes.remarcadas}`,
    `Cancelamentos: ${sessoes.canceladas}`,
    `Faturado (sessões realizadas): ${FORMATADOR_MOEDA(fechamento.faturado)}`,
    `Recebido (pagamentos confirmados no mês): ${FORMATADOR_MOEDA(fechamento.recebido)}`,
    `Pendente de recebimento (vencimento no mês): ${FORMATADOR_MOEDA(fechamento.aReceber)}`,
  ];
  for (const linha of linhasResumo) {
    doc.text(linha, margem, y);
    y += 6;
  }
  y += 6;

  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.text("Por convênio", margem, y);
  y += 8;

  doc.setFontSize(10);
  doc.text("Convênio", margem, y);
  doc.text("Sessões", margem + 90, y);
  doc.text("Faturado", largura - margem, y, { align: "right" });
  y += 2;
  doc.line(margem, y, largura - margem, y);
  y += 6;

  doc.setFont(undefined, "normal");
  if (fechamento.porConvenio.length === 0) {
    doc.text("Nenhuma sessão realizada neste mês.", margem, y);
    y += 6;
  } else {
    for (const linha of fechamento.porConvenio) {
      doc.text(linha.nome, margem, y);
      doc.text(String(linha.sessoes), margem + 90, y);
      doc.text(FORMATADOR_MOEDA(linha.faturado), largura - margem, y, { align: "right" });
      y += 6;
    }
  }

  y += 10;
  doc.setFontSize(9);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}.`, margem, y);

  doc.save(`fechamento_${mesRotulo.toLowerCase().replace(/\s+/g, "_")}.pdf`);
}
