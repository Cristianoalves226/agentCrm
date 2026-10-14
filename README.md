# Agent CRM — Painel pessoal de prospecção

Painel privado para organizar a prospecção de clientes de serviços de programação, começando por Mato Grosso.

## Stack

- React + TypeScript + Vite
- Supabase Auth
- PostgreSQL no Supabase com Row Level Security (RLS)
- Lucide React para ícones

## Funcionalidades implementadas nesta base inicial

- Login e criação de conta por e-mail/senha
- Dashboard com indicadores calculados a partir dos leads
- Cadastro e edição de empresas
- Pesquisa por empresa, cidade, contato e site
- Filtro por etapa comercial
- Alteração da etapa do lead
- Registro de segmento, cidade, contatos, fonte, serviço e valor estimado
- Layout responsivo para desktop e celular

## Configuração local

1. Instale Node.js LTS.
2. Execute `npm install`.
3. Copie `.env.example` para `.env.local`.
4. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com a URL e a chave publicável/anon do seu projeto Supabase.
5. No SQL Editor do Supabase, execute `supabase/schema.sql`.
6. Execute `npm run dev`.

Nunca coloque uma chave `service_role` no frontend nem a versione no Git.

## Banco e privacidade

A tabela `public.leads` armazena os leads. As políticas RLS restringem leitura e escrita aos registros cujo `user_id` corresponde ao usuário autenticado.

## Próximas etapas

- Importação CSV com validação e detecção de duplicados
- Histórico de atividades e lembretes
- Pesquisa assistida por cidade/segmento com links para fontes públicas
- Auditoria técnica básica de sites
- Exportação CSV e relatório de conversão

A busca assistida não deve automatizar coleta em massa em desacordo com os termos das plataformas.
