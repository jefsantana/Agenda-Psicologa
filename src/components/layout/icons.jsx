import { Bell, Calendar, ClipboardList, CreditCard, Ellipsis, FileText, LayoutGrid, LogOut, Mail, Search, Settings, CircleDollarSign, ChartNoAxesColumn, Users } from "lucide-react";

export function IconeDashboard(props) {
  return <LayoutGrid size={19} strokeWidth={1.8} {...props} />;
}

export function IconeAgenda(props) {
  return <Calendar size={19} strokeWidth={1.8} {...props} />;
}

export function IconeAtendimentos(props) {
  return <ClipboardList size={19} strokeWidth={1.8} {...props} />;
}

export function IconeProntuarios(props) {
  return <FileText size={19} strokeWidth={1.8} {...props} />;
}

export function IconePacientes(props) {
  return <Users size={19} strokeWidth={1.8} {...props} />;
}

export function IconeConvenios(props) {
  return <CreditCard size={19} strokeWidth={1.8} {...props} />;
}

export function IconeFinanceiro(props) {
  return <CircleDollarSign size={19} strokeWidth={1.8} {...props} />;
}

export function IconeRelatorios(props) {
  return <ChartNoAxesColumn size={19} strokeWidth={1.8} {...props} />;
}

export function IconeMensagens(props) {
  return <Mail size={19} strokeWidth={1.8} {...props} />;
}

export function IconeConfiguracoes(props) {
  return <Settings size={19} strokeWidth={1.8} {...props} />;
}

export function IconeSino(props) {
  return <Bell size={19} strokeWidth={1.8} {...props} />;
}

export function IconeBusca(props) {
  return <Search size={16} strokeWidth={1.8} {...props} />;
}

export function IconeMais(props) {
  return <Ellipsis size={19} strokeWidth={1.8} {...props} />;
}

export function IconeSair(props) {
  return <LogOut size={17} strokeWidth={1.8} {...props} />;
}
