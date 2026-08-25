import { describe, it, expect } from "vitest";
import { mapearAtendimento, mapearBloqueio, traduzirErroConflito } from "./atendimentosShared.js";

const LINHA_BASE = {
  id: "at-1",
  inicio: "2026-08-23T14:00:00Z",
  fim: "2026-08-23T14:50:00Z",
  tipo: "online",
  status: "agendado",
  valor: 150,
  paciente_id: "pac-1",
  convenio_id: null,
  paciente: { nome: "Maria Souza" },
  convenio: null,
};

describe("mapearAtendimento", () => {
  it("converte inicio/fim em Date e usa o nome do paciente/convênio relacionados", () => {
    const atendimento = mapearAtendimento({ ...LINHA_BASE, convenio: { nome: "Unimed" } });

    expect(atendimento.inicio).toBeInstanceOf(Date);
    expect(atendimento.fim).toBeInstanceOf(Date);
    expect(atendimento.paciente).toBe("Maria Souza");
    expect(atendimento.convenio).toBe("Unimed");
  });

  it("usa 'Paciente removido' quando o paciente relacionado não existe mais", () => {
    const atendimento = mapearAtendimento({ ...LINHA_BASE, paciente: null });
    expect(atendimento.paciente).toBe("Paciente removido");
  });

  it("sem convênio, usa null por padrão", () => {
    const atendimento = mapearAtendimento(LINHA_BASE);
    expect(atendimento.convenio).toBeNull();
  });

  it("aceita um fallback de convênio diferente (ex: 'Particular' na lista/dashboard)", () => {
    const atendimento = mapearAtendimento(LINHA_BASE, { convenioFallback: "Particular" });
    expect(atendimento.convenio).toBe("Particular");
  });
});

describe("mapearBloqueio", () => {
  it("converte inicio/fim em Date preservando os outros campos", () => {
    const bloqueio = mapearBloqueio({ id: "bl-1", inicio: "2026-08-23T00:00:00Z", fim: "2026-08-24T00:00:00Z", motivo: "Férias" });

    expect(bloqueio.inicio).toBeInstanceOf(Date);
    expect(bloqueio.fim).toBeInstanceOf(Date);
    expect(bloqueio.motivo).toBe("Férias");
  });
});

describe("traduzirErroConflito", () => {
  it("troca o erro de constraint de exclusão (23P01) por uma mensagem amigável", () => {
    const erroTraduzido = traduzirErroConflito({ code: "23P01" });
    expect(erroTraduzido.message).toBe("Já existe um atendimento marcado nesse horário.");
  });

  it("repassa qualquer outro erro sem alterar", () => {
    const erroOriginal = { code: "23505", message: "outro erro" };
    expect(traduzirErroConflito(erroOriginal)).toBe(erroOriginal);
  });
});
