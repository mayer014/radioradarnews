-- ============================================
-- MIGRATION: TABELAS BÁSICAS NORMALIZADAS
-- Data: 11/09/2025
-- ============================================

-- 1. TIPOS (com verificação de existência)
DO $$ BEGIN
    CREATE TYPE banner_type AS ENUM ('image', 'html', 'embed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE audit_level AS ENUM ('info', 'warn', 'error');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. TABELA DE AUTORES (se não existir)
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'authors') THEN
        CREATE TABLE public.authors (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            bio TEXT,
            avatar_url TEXT,
            social_jsonb JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 3. TABELA DE CATEGORIAS (se não existir)
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
        CREATE TABLE public.categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            color_hex TEXT DEFAULT '#3B82F6',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 4. TABELA DE TAGS (se não existir)
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tags') THEN
        CREATE TABLE public.tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 5. AUDIT LOG (se não existir)
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_log') THEN
        CREATE TABLE public.audit_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event TEXT NOT NULL,
            entity TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            payload_jsonb JSONB DEFAULT '{}',
            level audit_level DEFAULT 'info',
            context JSONB DEFAULT '{}',
            user_id UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;