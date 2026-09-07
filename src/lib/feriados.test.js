import { describe, it, expect } from "vitest";
import { feriadosDoAno, feriadoEm } from "./feriados.js";

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
