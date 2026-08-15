const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export function IconeDashboard(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="2" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="2" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="2" />
    </svg>
  );
}

export function IconeAgenda(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.2" />
      <path d="M3.5 9.5h17M8 3v3.4M16 3v3.4" />
    </svg>
  );
}

export function IconeAtendimentos(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M4 6h13M4 12h13M4 18h9" />
      <path d="M19 16.5l1.6 1.6L24 14.5" />
    </svg>
  );
}

export function IconeProntuarios(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M14.5 3.5V8h4M8.5 12.5h7M8.5 16h7" />
    </svg>
  );
}

export function IconePacientes(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 6.2c1.4.4 2.4 1.6 2.4 3.1s-1 2.7-2.4 3.1M17.7 14.6c2 .5 3.3 1.9 3.3 3.9" />
    </svg>
  );
}

export function IconeConvenios(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10.5h18M6.5 14.5h4" />
    </svg>
  );
}

export function IconeFinanceiro(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v10M14.8 9.5a2.8 2.8 0 0 0-2.6-1.6c-1.6 0-2.7.9-2.7 2s1 1.6 2.7 2 2.7.9 2.7 2-1.1 2-2.7 2a2.9 2.9 0 0 1-2.7-1.6" />
    </svg>
  );
}

export function IconeRelatorios(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
    </svg>
  );
}

export function IconeMensagens(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.4" />
      <path d="M4 6.5l8 6 8-6" />
    </svg>
  );
}

export function IconeConfiguracoes(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.5 7.5 0 0 0 0-2l2-1.4-2-3.4-2.3.7a7.6 7.6 0 0 0-1.7-1l-.4-2.4h-4l-.4 2.4a7.6 7.6 0 0 0-1.7 1l-2.3-.7-2 3.4L6.6 11a7.5 7.5 0 0 0 0 2l-2 1.4 2 3.4 2.3-.7c.5.4 1.1.75 1.7 1l.4 2.4h4l.4-2.4a7.6 7.6 0 0 0 1.7-1l2.3.7 2-3.4-2-1.4z" />
    </svg>
  );
}

export function IconeSino(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconeBusca(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...common} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
}

export function IconeMais(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...common} {...props}>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconeSair(props) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M9 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3" />
      <path d="M16 16l4-4-4-4M20 12H9" />
    </svg>
  );
}
