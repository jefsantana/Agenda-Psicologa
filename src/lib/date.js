const NOMES_DIA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function paraISO(date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Junta uma data (yyyy-mm-dd) com uma hora ("HH:MM") num Date local. */
export function combinarDataHora(dataISO, horaStr) {
  const [h, m] = horaStr.split(":").map(Number);
  const data = new Date(`${dataISO}T00:00:00`);
  data.setHours(h, m, 0, 0);
  return data;
}

export function formatarHora(date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const FORMATADOR_DATA_LONGA = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

/**
 * "Quinta-feira, 27 de agosto" — data por extenso com só a primeira letra
 * maiúscula. Substitui o `text-transform: capitalize` do CSS, que deixava
 * "Quinta-Feira, 27 De Agosto".
 */
export function dataLonga(date) {
  const texto = FORMATADOR_DATA_LONGA.format(date);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Segunda a domingo da semana que contém `baseDate`. */
export function semanaAtual(baseDate = new Date()) {
  const diaSemana = baseDate.getDay(); // 0 = domingo
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segunda = new Date(baseDate);
  segunda.setDate(baseDate.getDate() + deslocamento);
  segunda.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(segunda);
    dia.setDate(segunda.getDate() + i);
    return dia;
  });
}

export function inicioDoMes(baseDate = new Date()) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
}

export function fimDoMes(baseDate = new Date()) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59);
}

export function rotuloDia(date) {
  return NOMES_DIA[date.getDay()];
}

export function mesmaData(a, b) {
  return paraISO(a) === paraISO(b);
}

/** Diferença em minutos entre dois horários "HH:MM:SS" ou "HH:MM". */
export function minutosEntreHoras(horaInicio, horaFim) {
  const [h1, m1] = horaInicio.split(":").map(Number);
  const [h2, m2] = horaFim.split(":").map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
}

/** Minutos entre agora e uma data futura; null se já passou. */
export function minutosAte(dataAlvo) {
  const diffMs = dataAlvo.getTime() - Date.now();
  if (diffMs <= 0) return null;
  return Math.round(diffMs / 60000);
}

export function formatarMinutos(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas}h` : `${horas}h${resto}min`;
}

export function formatarMoeda(valor) {
  return (valor ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "R$ 1.560" — sem centavos, para números-resumo em KPIs e cabeçalhos. */
export function formatarMoedaResumo(valor) {
  return (valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
