-- Migração v5 — espaço de armazenamento para os anexos do prontuário
--
-- Como usar: cole no SQL Editor do Supabase e clique em Run. Roda depois do
-- schema_v4_financeiro.sql. Cria um bucket de Storage privado (só quem
-- estiver logada consegue ler/enviar/apagar arquivos) e as políticas
-- de acesso dele. A tabela `anexos` já existia desde o schema_v2.

insert into storage.buckets (id, name, public)
values ('prontuario-anexos', 'prontuario-anexos', false)
on conflict (id) do nothing;

create policy "psicologa_le_anexos" on storage.objects
  for select to authenticated
  using (bucket_id = 'prontuario-anexos');

create policy "psicologa_envia_anexos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'prontuario-anexos');

create policy "psicologa_apaga_anexos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'prontuario-anexos');
