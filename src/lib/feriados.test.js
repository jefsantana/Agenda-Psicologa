import { describe, it, expect, beforeEach } from "vitest";
import { feriadosDoAno, feriadoEm, definirFeriadosPersonalizados } from "./feriados.js";

beforeEach(() => definirFeriadosPersonalizados([]));

describe("feriadosDoAno", () => {
  it("inclui os feriados nacionais de data fixa", () => {
    const f = feriadosDoAno(2026);
    expect(f.get("2026-01-01")).toBe("Confraternização Universal");
    expect(f.get("2026-04-21")).toBe("Tiradentes");
    expect(f.get("2026-05-01")).toBe("Dia do Trabalho");
    expect(f.get("2026-09-07")).toBe("Independência do Brasil");
    expect(f.get("2026-11-20")).toBe("Dia da Consciência Negra");
    expect(f.get("2026-12-25")).toBe("Natal");
  });

  it("calcula os feriados móveis a partir da Páscoa (05/04/2026)", () => {
    const f = feriadosDoAno(2026);
    expect(f.get("2026-04-03")).toBe("Sexta-feira Santa"); // 2 dias antes
    expect(f.get("2026-02-16")).toBe("Carnaval"); // segunda
    expect(f.get("2026-02-17")).toBe("Carnaval"); // terça
    expect(f.get("2026-06-04")).toBe("Corpus Christi"); // 60 dias depois
  });

  it("recalcula os móveis para outro ano (Páscoa 20/04/2025)", () => {
    const f = feriadosDoAno(2025);
    expect(f.get("2025-04-18")).toBe("Sexta-feira Santa");
    expect(f.get("2025-03-04")).toBe("Carnaval");
    expect(f.get("2025-06-19")).toBe("Corpus Christi");
  });
});

describe("feriadoEm", () => {
  it("retorna o nome do feriado para a data ISO", () => {
    expect(feriadoEm("2026-12-25")).toBe("Natal");
    expect(feriadoEm("2025-04-18")).toBe("Sexta-feira Santa");
  });

  it("retorna null em dia comum ou entrada inválida", () => {
    expect(feriadoEm("2026-12-26")).toBeNull();
    expect(feriadoEm("")).toBeNull();
    expect(feriadoEm(null)).toBeNull();
    expect(feriadoEm(undefined)).toBeNull();
  });
});

describe("feriados personalizados (do Supabase)", () => {
  it("considera um feriado de data única", () => {
    definirFeriadosPersonalizados([
      { data: "2026-12-26", nome: "Recesso de fim de ano", repete_todo_ano: false },
    ]);
    expect(feriadoEm("2026-12-26")).toBe("Recesso de fim de ano");
    expect(feriadoEm("2027-12-26")).toBeNull();
  });

  it("considera um feriado que repete todo ano (só mês/dia)", () => {
    definirFeriadosPersonalizados([
      { data: "2026-01-25", nome: "Aniversário da cidade", repete_todo_ano: true },
    ]);
    expect(feriadoEm("2026-01-25")).toBe("Aniversário da cidade");
    expect(feriadoEm("2030-01-25")).toBe("Aniversário da cidade");
  });

  it("o feriado nacional tem prioridade sobre o personalizado na mesma data", () => {
    definirFeriadosPersonalizados([
      { data: "2026-12-25", nome: "Outro nome", repete_todo_ano: true },
    ]);
    expect(feriadoEm("2026-12-25")).toBe("Natal");
  });
});
