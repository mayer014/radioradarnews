-- REMOÇÃO COMPLETA DO SISTEMA DE BANNERS

-- 1. Remover todas as tabelas relacionadas a banners
DROP TABLE IF EXISTS banner_queue CASCADE;
DROP TABLE IF EXISTS banner_schedule CASCADE; 
DROP TABLE IF EXISTS banner_slots CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS banners_normalized CASCADE;

-- 2. Remover funções relacionadas a banners
DROP FUNCTION IF EXISTS get_current_banner(text) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_banners() CASCADE;
DROP FUNCTION IF EXISTS update_banner_queue_updated_at() CASCADE;

-- 3. Limpar dados do audit_log relacionados a banners
DELETE FROM audit_log WHERE entity = 'banner' OR entity LIKE '%banner%' OR event LIKE '%banner%';