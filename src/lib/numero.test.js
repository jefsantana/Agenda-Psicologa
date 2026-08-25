import { describe, it, expect } from "vitest";
import { paraNumero, paraTextoValor } from "./numero.js";

describe("paraNumero", () => {
  it("aceita vírgula decimal (formato brasileiro)", () => {
    expect(paraNumero("150,50")).toBe(150.5);
  });

  it("remove separador de milhar em ponto antes de converter", () => {
    expect(paraNumero("1.234,90")).toBe(1234.9);
  });

  it("trata texto vazio, nulo ou indefinido como ausência de valor", () => {
    expect(paraNumero("")).toBeNull();
    expect(paraNumero(null)).toBeNull();
    expect(paraNumero(undefined)).toBeNull();
  });

  it("retorna null para texto que não é um número válido", () => {
    expect(paraNumero("abc")).toBeNull();
  });
});

describe("paraTextoValor", () => {
  it("formata com duas casas decimais e vírgula, sem símbolo de moeda", () => {
    expect(paraTextoValor(150.5)).toBe("150,50");
  });

  it("trata valor vazio/nulo/indefinido como texto vazio", () => {
    expect(paraTextoValor(null)).toBe("");
    expect(paraTextoValor(undefined)).toBe("");
    expect(paraTextoValor("")).toBe("");
  });
});
