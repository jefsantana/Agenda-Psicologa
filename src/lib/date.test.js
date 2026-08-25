import { describe, it, expect } from "vitest";
import {
  paraISO,
  combinarDataHora,
  semanaAtual,
  inicioDoMes,
  fimDoMes,
  rotuloDia,
  mesmaData,
  minutosEntreHoras,
  minutosAte,
  formatarMinutos,
  formatarMoeda,
} from "./date.js";

describe("paraISO", () => {
  it("formata data local como yyyy-mm-dd, sem depender de fuso", () => {
    expect(paraISO(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(paraISO(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("combinarDataHora", () => {
  it("junta uma data (yyyy-mm-dd) com uma hora (HH:MM) em horário local", () => {
    const resultado = combinarDataHora("2026-08-23", "14:30");
    expect(resultado.getFullYear()).toBe(2026);
    expect(resultado.getMonth()).toBe(7); // agosto = índice 7
    expect(resultado.getDate()).toBe(23);
    expect(resultado.getHours()).toBe(14);
    expect(resultado.getMinutes()).toBe(30);
  });
});

describe("semanaAtual", () => {
  it("retorna 7 dias começando na segunda-feira, mesmo quando a base é domingo", () => {
    const domingo = new Date(2026, 7, 23); // 23/08/2026 é um domingo
    const dias = semanaAtual(domingo);

    expect(dias).toHaveLength(7);
    expect(dias[0].getDay()).toBe(1); // segunda
    expect(dias[6].getDay()).toBe(0); // domingo
    expect(paraISO(dias[6])).toBe("2026-08-23");
  });

  it("mantém a segunda como primeiro dia quando a base já é um dia de semana", () => {
    const quarta = new Date(2026, 7, 19); // 19/08/2026 é uma quarta
    const dias = semanaAtual(quarta);

    expect(dias[0].getDay()).toBe(1);
    expect(paraISO(dias[0])).toBe("2026-08-17");
  });
});

describe("inicioDoMes / fimDoMes", () => {
  it("cobre o mês inteiro, incluindo o último instante do último dia", () => {
    const base = new Date(2026, 1, 15); // fevereiro/2026 (não bissexto)
    expect(paraISO(inicioDoMes(base))).toBe("2026-02-01");

    const fim = fimDoMes(base);
    expect(paraISO(fim)).toBe("2026-02-28");
    expect(fim.getHours()).toBe(23);
    expect(fim.getMinutes()).toBe(59);
  });
});

describe("rotuloDia", () => {
  it("usa as abreviações em português começando no domingo", () => {
    expect(rotuloDia(new Date(2026, 7, 23))).toBe("dom");
    expect(rotuloDia(new Date(2026, 7, 24))).toBe("seg");
  });
});

describe("mesmaData", () => {
  it("compara apenas ano/mês/dia, ignorando a hora", () => {
    const manha = new Date(2026, 7, 23, 8, 0);
    const noite = new Date(2026, 7, 23, 22, 0);
    const outroDia = new Date(2026, 7, 24, 8, 0);

    expect(mesmaData(manha, noite)).toBe(true);
    expect(mesmaData(manha, outroDia)).toBe(false);
  });
});

describe("minutosEntreHoras", () => {
  it("calcula a diferença em minutos entre dois horários HH:MM", () => {
    expect(minutosEntreHoras("08:00", "12:00")).toBe(240);
    expect(minutosEntreHoras("08:00:00", "08:50:00")).toBe(50);
  });
});

describe("minutosAte", () => {
  it("retorna null quando o instante já passou", () => {
    expect(minutosAte(new Date(Date.now() - 1000))).toBeNull();
  });

  it("arredonda os minutos até um instante futuro", () => {
    const daqui10min = new Date(Date.now() + 10 * 60 * 1000);
    expect(minutosAte(daqui10min)).toBe(10);
  });
});

describe("formatarMinutos", () => {
  it("mostra só minutos abaixo de uma hora", () => {
    expect(formatarMinutos(45)).toBe("45 min");
  });

  it("mostra horas cheias sem sobra de minutos", () => {
    expect(formatarMinutos(120)).toBe("2h");
  });

  it("mostra horas e minutos quando há sobra", () => {
    expect(formatarMinutos(125)).toBe("2h5min");
  });
});

describe("formatarMoeda", () => {
  it("trata valor nulo/undefined como zero", () => {
    expect(formatarMoeda(null)).toContain("0,00");
    expect(formatarMoeda(undefined)).toContain("0,00");
  });

  it("formata em Real com vírgula decimal", () => {
    expect(formatarMoeda(1234.5)).toContain("1.234,50");
  });
});
