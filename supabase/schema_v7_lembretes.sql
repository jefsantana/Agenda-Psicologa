-- ==========================================================
-- AJUSTES DE UX (agosto/2026) — Compromissos pessoais
-- "Próximos compromissos" deixa de duplicar os atendimentos clínicos (que
-- já aparecem na Agenda) e passa a ser um espaço para lembretes pessoais
-- com horário (ex.: "15h — dentista"), sem vínculo com paciente.
-- Reaproveita a tabela `tarefas`: uma tarefa com `hora` preenchida é um
-- "compromisso"; sem `hora`, continua sendo um item de checklist comum.
-- ==========================================================
alter table public.tarefas add column if not exists hora time;
