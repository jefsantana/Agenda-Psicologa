# Gates: Pipeline de status de Pacientes (Ativos/Em espera/Alta)

OWNS: src/pages/PacientesPage.jsx, src/pages/PacientesPage.css, src/lib/pacientes.js

Scope: expor no /pacientes o campo `status` que já existe no banco (ativo/pendente/novo/inativo) como abas de filtro "Ativos/Em espera/Alta", e ampliar a busca para aceitar CPF além do nome — igual ao protótipo "Modelo App". Não cria coluna nem tabela nova; é só UI sobre dado que já existe.

- [x] G5: PacientesPage tem as 3 abas de filtro por status
  CHECK: node -e "const c=require('fs').readFileSync('src/pages/PacientesPage.jsx','utf8'); for (const r of ['Ativos','Em espera','Alta']) if(!c.includes(r)) throw new Error('aba ausente: '+r); console.log('ABAS_OK')"
  EXPECT: ABAS_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=0606aea372d8ccc228bb4b8de24f7d19f28967fce7c2ef7739234af12a7a73af; output-bytes=8

- [x] G6: buscarPacientes casa por CPF quando o termo tem 3+ dígitos, além de nome
  CHECK: node -e "const c=require('fs').readFileSync('src/lib/pacientes.js','utf8'); if(!/cpf\.ilike/.test(c)) throw new Error('filtro por cpf ausente'); console.log('BUSCA_CPF_OK')"
  EXPECT: BUSCA_CPF_OK
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=643e6583319867666049e545df4fae02059e1cd52f656108a4bd93741a19c172; output-bytes=13

- [x] G7: Nenhum erro de compilação nos arquivos alterados
  CHECK: npx oxlint src/pages/PacientesPage.jsx src/lib/pacientes.js && echo LINT_OK
  EXPECT: LINT_OK
  CWD: D:/Projetos-códigos/Projeto-Agedamento-Psicologico
  EVIDENCE: exit=0; shell=C:\Windows\system32\cmd.exe; cwd=D:\Projetos-códigos\Projeto-Agedamento-Psicologico; path=2081c7943321/32 entries; EXPECT=matched; output-sha256=566348787f7dbaa871b64adda4cdca556afc2f0f6d376a57d55493246b2c0292; output-bytes=9
