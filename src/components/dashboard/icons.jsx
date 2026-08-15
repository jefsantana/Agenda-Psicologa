const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export function IconeChecklist(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M4 6.5l1.6 1.6L9 4.5M4 13.5l1.6 1.6L9 11.5M4 20.5l1.6 1.6L9 18.5" />
      <path d="M13 6h7M13 13h7M13 20h7" />
    </svg>
  );
}

export function IconeRelogio(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...common} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconeAlerta(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M12 3.5l9.5 16.5h-19z" />
      <path d="M12 9.5v4.2M12 17h.01" />
    </svg>
  );
}

export function IconeCifrao(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M12 3v18" />
      <path d="M16.5 7.2A4 4 0 0 0 12.8 5H11a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-2a4 4 0 0 1-3.7-2.5" />
    </svg>
  );
}

export function IconeMais(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconePacienteMais(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...common} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.4-5.2 5.5-5.2s5.5 2.2 5.5 5.2" />
      <path d="M18.5 8v5M16 10.5h5" />
    </svg>
  );
}

export function IconeProntuarioMais(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M9 13h6M9 16.5h6" />
    </svg>
  );
}

export function IconeEnviar(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M21 3L3 10.5l7 2.7L21 3z" />
      <path d="M12.7 14.5L21 3l-3.5 12.2-4.8-.7z" />
    </svg>
  );
}

export function IconeSeta(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" {...common} {...props}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function IconeCalendario(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...common} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconeMaisOpcoes(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="5.5" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="18.5" r="1.7" />
    </svg>
  );
}

export function IconeWhatsapp(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.1.1-.3.1-.4 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z" />
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
    </svg>
  );
}
