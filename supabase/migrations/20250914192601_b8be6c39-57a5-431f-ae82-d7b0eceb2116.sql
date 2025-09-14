-- Remover completamente todas as tabelas e configurações relacionadas ao sistema de rádio

-- Deletar tabela de programas de rádio
DROP TABLE IF EXISTS public.radio_programs CASCADE;

-- Remover configurações de rádio das settings
DELETE FROM public.settings WHERE category = 'radio';
DELETE FROM public.settings WHERE key = 'stream_url';
DELETE FROM public.settings WHERE key LIKE '%radio%';

-- Limpar qualquer outro resquício relacionado ao rádio
DELETE FROM public.audit_log WHERE entity = 'radio_program' OR entity LIKE '%radio%';