# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React (Vite, SPA — não Next.js) + Supabase (Postgres, Auth por e-mail/senha sem 2FA, RLS, Edge Functions no lugar de um backend Node/NestJS separado, `pg_cron` no lugar de filas Redis para lembretes agendados). Um documento de especificação de referência (agosto/2026) sugeria Next.js + NestJS + Prisma + Redis; decisão explícita da usuária foi manter a base Vite + Supabase já construída e adaptar esse documento a ela, em vez de migrar de stack. Código versionado no GitHub. Hospedagem/deploy ainda não decidido pela usuária — uso diário é pelo navegador do celular e do notebook, então será necessário publicar o site em algum serviço mais adiante (ex: Vercel conectado ao GitHub); registrado como decisão em aberto.

## Users

Usuária única: Psicóloga Raquel Frois, que administra sozinha toda a agenda, pacientes e prontuários. Não há login de paciente — pacientes não acessam o sistema; todo agendamento e cadastro é feito manualmente pela psicóloga, inclusive lembrar o paciente via WhatsApp (ação manual, não automática — ver Capabilities). Uso diário via navegador, majoritariamente pelo celular, também pelo notebook — a partir da v2 (documento de referência de agosto/2026) o desktop passou a ter um layout próprio (sidebar), não apenas uma versão esticada do mobile.

## Product Purpose

Sistema de agenda, atendimentos e prontuário eletrônico de uso exclusivo para uma psicóloga autônoma, substituindo controle manual por um painel único. A v1 cobria agendamento básico; a v2 (a partir de um documento de especificação trazido pela usuária em agosto/2026) amplia o produto para um sistema clínico mais completo — com prontuário versionado e auditável, conformidade LGPD/CFP, e módulos de convênios/financeiro/relatórios previstos para fases posteriores. Sucesso continua sendo o mesmo: em poucos toques pelo celular (ou pelo notebook), ver a agenda, marcar uma consulta sem conflito de horário, e manter o prontuário em dia com segurança.

## Positioning

Não é um SaaS multi-tenant para clínicas com múltiplos profissionais — é uma ferramenta pessoal moldada ao fluxo de uma psicóloga autônoma: tipo de atendimento online/presencial, convênios (incluindo o fluxo próprio da Unimed), prontuário com o modelo dela, e agora também conformidade documental (CFP nº 001/2009 e nº 011/2018) e LGPD por lidar com dados de saúde.

## Operating Context

- Uso diário, tanto no celular (navegador) quanto no notebook — cada plataforma agora tem seu próprio layout de referência (mobile: tab bar de 5 itens; desktop: sidebar fixa de 236px + coluna direita de 322px).
- Fluxo típico: abrir o dashboard, ver KPIs do dia e lembretes de consultas próximas, lançar rapidamente um novo agendamento, consultar a agenda para achar horário livre.
- Ao atender pacientes Unimed, lança o atendimento (senha, cartão, cliente, data de execução, e-mail do cliente) para depois exportar em Excel por período — este fluxo é posterior (fase de convênios/financeiro), não parte do MVP atual.
- Prontuário: entra na Fase 1. Estrutura rica — evoluções versionadas (não apenas um campo de texto), objetivos terapêuticos em checklist, anexos, e trilha de auditoria (quem acessou, quando). O modelo de prontuário físico que a psicóloga possui ainda será anexado ao projeto para adaptar os campos exatos.
- Contato com paciente pelo WhatsApp continua sendo sempre uma ação manual iniciada pela psicóloga a partir do cadastro do paciente — decisão reafirmada mesmo depois de o documento de referência sugerir confirmação automática por WhatsApp/e-mail 24h antes (essa automação fica descartada por ora: exigiria conta comercial aprovada pela Meta e custo por mensagem).

## Capabilities and Constraints — Fase 1 (escopo atual)

- Autenticação: e-mail e senha (Supabase Auth), sem 2FA — decisão explícita da usuária, que voltou atrás da exigência de 2FA do documento de referência para manter o login simples. Usuária única, sem cadastro de paciente com login.
- Cadastro de paciente: nome (único campo obrigatório), nascimento, CPF, e-mail, telefone/WhatsApp, convênio, carteirinha, responsável legal (para menores), data do termo de consentimento — todos opcionais exceto o nome.
- Agenda e atendimentos: visões dia/semana/mês; tipo de atendimento (Online/Presencial); status (agendado, aguardando, confirmado, remarcar, realizado, falta, cancelado); duração padrão 50 min; bloqueios de agenda (intervalos, férias) que impedem novo agendamento; prevenção de conflito de horário no banco (constraint de exclusão), não apenas na tela.
- Prontuário: abas Evolução / Histórico / Anexos / Dados cadastrais. Evoluções versionadas (sem exclusão física — soft delete + log), com modelos SOAP e livre. Objetivos terapêuticos em checklist. Anexos (PDF/imagem) com limite de 20 MB. Selo "LGPD · sigiloso" visível; todo acesso gera registro em trilha de auditoria.
- Dashboard: KPIs do dia (atendimentos hoje, próximos atendimentos em janela de 2h, faltas/remarcações do dia, recebimentos do mês — este último é só leitura nesta fase, sem módulo financeiro completo ainda), agenda do dia, ações rápidas, calendário do mês, próximos compromissos, tarefas com checkbox.
- Segurança/LGPD: TLS em trânsito e criptografia em repouso (via infraestrutura do Supabase) para dados sensíveis de saúde; sessão expira após 30 min de inatividade; nenhum dado clínico em cache do navegador; termo de consentimento datado por paciente; guarda mínima de prontuário de 5 anos (CFP).
- Nível técnico da usuária: iniciante em programação — instruções de setup devem ser detalhadas passo a passo.

## Capabilities — fases futuras (fora do escopo atual, não construir ainda)

- Convênios com regras de repasse/teto mensal, módulo Financeiro completo (recebido/a receber/em atraso, baixa manual, recibo em PDF), lançamento e exportação Unimed.
- Confirmação automática de consulta por WhatsApp/e-mail com registro de status de envio (a menos que a usuária mude de ideia sobre a automação — ver Operating Context).
- Relatórios (produtividade, ocupação, faturamento, faltas), Mensagens (histórico + modelos), Configurações avançadas, agendamento recorrente semanal, exportações.
- App móvel nativo (a v2 usa navegador móvel responsivo, não um app instalado).

## Brand Commitments

**Nome do produto: "Espaço Raquel Frois"** — confirmado pela tela de login enviada em Figma pela usuária (setembro/2026), substitui o placemat "Consultório — Raquel Frois" da v1. Usado no título da tela de login e no título da aba do navegador. Identidade visual: a partir de agosto/2026, a usuária trouxe uma documentação de design completa (v5, tema escuro) com tokens de cor, tipografia (Inter Tight) e geometria exatos, que **substitui integralmente** a identidade quente/clara construída anteriormente — essa nova identidade está registrada em [DESIGN.md] a partir desta versão. O nome "Dra. Ana Silva" citado no texto do documento de referência original é um placeholder de modelo; o nome real da profissional é Raquel Frois, confirmado pelas telas de referência anexadas (a tela de login em Figma também mostra o avatar com a inicial "A", herdada do mesmo template — os avatares do sistema usam as iniciais reais "RF"/nome da usuária, não essa letra).

## Evidence on Hand

Documento de especificação completo (PDF, agosto/2026) com tokens de design, modelo de dados, API sugerida e critérios de aceite — usado como referência de implementação, adaptado à stack Vite+React+Supabase já em uso. Quatro imagens de referência visual (dashboard desktop 1440×900, e 6 telas mobile 390×844: login, dashboard, agenda, prontuário/evolução, pacientes, financeiro) — usar como fonte de verdade para composição e densidade de cada tela ao construir. Modelo de prontuário físico da psicóloga ainda não anexado. Nenhum dado real de paciente/convênio/histórico existe — todo texto de exemplo nas telas deve ser claramente sintético.

## Product Principles

1. Simplicidade operacional acima de tudo: cada tela deve ser operável rapidamente pelo celular, mas agora também precisa ter uma versão desktop própria e igualmente cuidada — não uma esticada do mobile.
2. Usuária única: mesmo com trilha de auditoria (exigência de segurança, não de multiusuário), não desenhar convites, papéis ou permissões multiusuário.
3. Nada automático além do que foi pedido: lembretes de dashboard e contato via WhatsApp continuam manuais; automações (confirmação automática, financeiro, relatórios) só entram quando essas fases forem priorizadas.
4. Dados sensíveis de saúde exigem cuidado redobrado: LGPD e resoluções do CFP não são only opcionais — prontuário, anexos e auditoria são parte do MVP, não um adicional.
5. Fidelidade à documentação de design trazida pela usuária: tokens, tipografia e geometria da v5 (dark) são a fonte de verdade visual; não improvisar valores fora dela.

## Accessibility & Inclusion

Contraste mínimo AA (4.5:1) é um requisito explícito do documento de design — atenção especial a textos secundários (`--text-3` `#7C8494`) sobre fundo de superfície (`#14171E`) em tamanhos abaixo de 12px, subindo para uma variante mais clara quando necessário. Responsivo sem scroll horizontal entre 1280–1920px no desktop e 360–430pt no mobile.
