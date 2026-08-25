import { describe, it, expect, vi } from "vitest";

// agenda.js importa o cliente supabase no topo do módulo; como o arquivo
// real lança erro sem as variáveis de ambiente do projeto, mockamos aqui
// para poder testar a lógica pura e a tradução de erro isoladamente.
vi.mock("./supabaseClient.js", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(async () => ({ error: { code: "23P01" } })),
    })),
  },
}));

const { slotsDisponiveis, criarAtendimentoRapido } = await import("./agenda.js");

describe("slotsDisponiveis", () => {
  it("é zero quando o dia está desativado na configuração", () => {
    expect(slotsDisponiveis({ ativo: false, hora_inicio: "08:00", hora_fim: "18:00", duracao_padrao_minutos: 50 })).toBe(0);
  });

  it("é zero quando não há configuração para o dia", () => {
    expect(slotsDisponiveis(null)).toBe(0);
  });

  it("calcula quantos atendimentos cabem no intervalo configurado", () => {
    // 08:00–18:00 = 600 min; 600 / 50 = 12 vagas
    expect(slotsDisponiveis({ ativo: true, hora_inicio: "08:00", hora_fim: "18:00", duracao_padrao_minutos: 50 })).toBe(12);
  });

  it("nunca retorna menos de 1 vaga quando o dia está ativo", () => {
    expect(slotsDisponiveis({ ativo: true, hora_inicio: "08:00", hora_fim: "08:10", duracao_padrao_minutos: 50 })).toBe(1);
  });
});

describe("criarAtendimentoRapido", () => {
  it("traduz o erro de conflito de horário do Postgres numa mensagem amigável", async () => {
    await expect(
      criarAtendimentoRapido({ pacienteId: "pac-1", inicio: new Date(), fim: new Date(), tipo: "online" })
    ).rejects.toThrow("Já existe um atendimento marcado nesse horário.");
  });
});
