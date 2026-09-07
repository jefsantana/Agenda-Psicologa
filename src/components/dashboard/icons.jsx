import { ArrowUp, Calendar, ChevronRight, Clock, DollarSign, EllipsisVertical, FileText, ListChecks, Plus, Send, TriangleAlert, UserPlus } from "lucide-react";

export function IconeChecklist(props) {
  return <ListChecks size={16} strokeWidth={1.8} {...props} />;
}

export function IconeRelogio(props) {
  return <Clock size={16} strokeWidth={1.8} {...props} />;
}

export function IconeAlerta(props) {
  return <TriangleAlert size={16} strokeWidth={1.8} {...props} />;
}

export function IconeCifrao(props) {
  return <DollarSign size={16} strokeWidth={1.8} {...props} />;
}

export function IconeMais(props) {
  return <Plus size={18} strokeWidth={1.8} {...props} />;
}

export function IconePacienteMais(props) {
  return <UserPlus size={18} strokeWidth={1.8} {...props} />;
}

export function IconeProntuarioMais(props) {
  return <FileText size={18} strokeWidth={1.8} {...props} />;
}

export function IconeEnviar(props) {
  return <Send size={18} strokeWidth={1.8} {...props} />;
}

export function IconeSeta(props) {
  return <ChevronRight size={14} strokeWidth={1.8} {...props} />;
}

export function IconeSetaCima(props) {
  return <ArrowUp size={13} strokeWidth={1.8} {...props} />;
}

export function IconeCalendario(props) {
  return <Calendar size={18} strokeWidth={1.8} {...props} />;
}

export function IconeMaisOpcoes(props) {
  return <EllipsisVertical size={18} strokeWidth={1.8} {...props} />;
}

/** Logo de marca (WhatsApp) — não faz parte do conjunto Lucide, mantido como SVG próprio. */
export function IconeWhatsapp(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.1.1-.3.1-.4 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z" />
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
    </svg>
  );
}
