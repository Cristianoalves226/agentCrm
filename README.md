# Agent CRM — Painel pessoal de prospecção

Painel privado para organizar a prospecção de clientes de serviços de programação, começando por Mato Grosso.

## Objetivo

Ajudar a encontrar e qualificar empresas, registrar oportunidades e acompanhar contatos até a contratação de serviços como:

- Criação de sites e landing pages
- Sistemas web
- Lojas virtuais
- Manutenção e melhorias
- Automações e integrações

## MVP planejado

1. Dashboard comercial
2. Cadastro e importação CSV de empresas
3. Pesquisa assistida por segmento e cidade
4. Análise básica de presença digital
5. Funil de prospecção e histórico de contatos
6. Tarefas e lembretes

## Stack proposta

- React + TypeScript + Vite
- Supabase Auth e PostgreSQL com Row Level Security (RLS)
- Hospedagem estática compatível com Vite

## Segurança

- Não versionar `.env` ou chaves secretas.
- Aplicar RLS nas tabelas expostas.
- Usar apenas a chave pública/anon ou publishable no frontend.
- Não automatizar coleta que viole termos das fontes.

## Estado atual

Documento inicial de escopo. A integração com o Supabase e a interface serão implementadas em etapas, após validar a estrutura do repositório e as configurações do projeto.