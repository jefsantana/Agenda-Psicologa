import { describe, it, expect, vi } from "vitest";
import { paraISO } from "./date.js";

// financeiro.js importa o cliente supabase no topo do módulo; como o
// arquivo real lança erro sem as variáveis de ambiente do projeto, o
// mock evita que o teste dependa de configuração externa.
vi.mock("./supabaseClient.js", () => ({ supabase: {} }));

const { statusLancamento } = await import("./financeiro.js");

// Usa paraISO (data local), a mesma função que statusLancamento usa —
// toISOString() serializa em UTC e, num fuso atrás de UTC (ex.: Brasília),
// "ontem" em horário local pode virar "hoje" em UTC à noite, quebrando o teste.
function ontem() {
  const data = new Date();
  data.setDate(data.getDate() - 1);
  return paraISO(data);
}

function amanha() {
  const data = new Date();
  data.setDate(data.getDate() + 1);
  return paraISO(data);
}

describe("statusLancamento", () => {
  it("é 'pago' quando já tem data de pagamento, mesmo vencido", () => {
    expect(statusLancamento({ pagoEm: "2026-01-01", vencimento: ontem() })).toBe("pago");
  });

  it("é 'atrasado' quando não foi pago e o vencimento já passou", () => {
    expect(statusLancamento({ pagoEm: null, vencimento: ontem() })).toBe("atrasado");
  });

  it("é 'pendente' quando não foi pago e o vencimento ainda não chegou", () => {
    expect(statusLancamento({ pagoEm: null, vencimento: amanha() })).toBe("pendente");
  });
});
