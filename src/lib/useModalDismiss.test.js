import { describe, it, expect } from "vitest";
import { proximoFoco } from "./useModalDismiss.js";

describe("proximoFoco — captura de Tab dentro do modal", () => {
  it("sem elementos focáveis, deixa o Tab seguir normalmente", () => {
    expect(proximoFoco(0, -1, false)).toBe(null);
    expect(proximoFoco(0, -1, true)).toBe(null);
  });

  it("Tab no último elemento volta para o primeiro", () => {
    expect(proximoFoco(4, 3, false)).toBe(0);
  });

  it("Shift+Tab no primeiro elemento vai para o último", () => {
    expect(proximoFoco(4, 0, true)).toBe(3);
  });

  it("Tab no meio da lista não é interceptado", () => {
    expect(proximoFoco(4, 1, false)).toBe(null);
    expect(proximoFoco(4, 2, true)).toBe(null);
  });

  it("foco fora do modal é trazido de volta para dentro", () => {
    expect(proximoFoco(4, -1, false)).toBe(0);
    expect(proximoFoco(4, -1, true)).toBe(3);
  });

  it("com um único elemento focável, Tab e Shift+Tab mantêm o foco nele", () => {
    expect(proximoFoco(1, 0, false)).toBe(0);
    expect(proximoFoco(1, 0, true)).toBe(0);
  });
});
