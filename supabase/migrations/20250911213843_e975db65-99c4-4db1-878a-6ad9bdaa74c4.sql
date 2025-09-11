-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar enum para roles de usuário
CREATE TYPE public.user_role AS ENUM ('admin', 'colunista');

-- Criar enum para status de artigos
CREATE TYPE public.article_status AS ENUM ('draft', 'published');

-- Criar enum para status de comentários
CREATE TYPE public.comment_status AS ENUM ('pending', 'approved', 'rejected');

-- Criar enum para status de assinantes
CREATE TYPE public.subscriber_status AS ENUM ('active', 'unsubscribed', 'bounced');

-- Criar enum para status de campanhas
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sent');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'colunista',
    
    -- Campos específicos para colunistas
    avatar TEXT,
    bio TEXT,
    specialty TEXT,
    allowed_categories TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de artigos/notícias
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    category TEXT NOT NULL,
    featured_image TEXT,
    source_url TEXT,
    source_domain TEXT,
    views INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    status article_status DEFAULT 'published',
    is_column_copy BOOLEAN DEFAULT false,
    original_article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    
    -- Autor (pode ser admin ou colunista)
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Dados do colunista (denormalizado para performance)
    columnist_id TEXT,
    columnist_name TEXT,
    columnist_avatar TEXT,
    columnist_bio TEXT,
    columnist_specialty TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de comentários
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    content TEXT NOT NULL,
    status comment_status DEFAULT 'pending',
    ip_address INET,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens de contato
CREATE TABLE public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de assinantes da newsletter
CREATE TABLE public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    status subscriber_status DEFAULT 'active',
    source TEXT DEFAULT 'manual',
    tags TEXT[] DEFAULT '{}',
    
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de campanhas de newsletter
CREATE TABLE public.newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT NOT NULL,
    status campaign_status DEFAULT 'draft',
    tags TEXT[] DEFAULT '{}',
    
    recipient_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de templates de newsletter
CREATE TABLE public.newsletter_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de configurações do sistema
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- 'comments', 'newsletter', 'general'
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(category, key)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'admin'
    );
$$;

-- Função para verificar se usuário é colunista ativo
CREATE OR REPLACE FUNCTION public.is_active_columnist(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'colunista' AND is_active = true
    );
$$;

-- RLS Policies para profiles
CREATE POLICY "Profiles são visíveis por todos" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins podem inserir novos perfis" ON public.profiles
FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar qualquer perfil" ON public.profiles
FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar perfis" ON public.profiles
FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies para articles
CREATE POLICY "Artigos publicados são visíveis por todos" ON public.articles
FOR SELECT USING (status = 'published');

CREATE POLICY "Admins podem ver todos os artigos" ON public.articles
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Colunistas podem ver seus próprios artigos" ON public.articles
FOR SELECT USING (author_id = auth.uid());

CREATE POLICY "Admins podem inserir artigos" ON public.articles
FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Colunistas ativos podem inserir artigos" ON public.articles
FOR INSERT WITH CHECK (public.is_active_columnist(auth.uid()) AND author_id = auth.uid());

CREATE POLICY "Admins podem atualizar qualquer artigo" ON public.articles
FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Colunistas podem atualizar seus próprios artigos" ON public.articles
FOR UPDATE USING (author_id = auth.uid() AND public.is_active_columnist(auth.uid()));

CREATE POLICY "Admins podem deletar artigos" ON public.articles
FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies para comments
CREATE POLICY "Comentários aprovados são visíveis por todos" ON public.comments
FOR SELECT USING (status = 'approved');

CREATE POLICY "Admins podem ver todos os comentários" ON public.comments
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Qualquer um pode inserir comentários" ON public.comments
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins podem atualizar comentários" ON public.comments
FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar comentários" ON public.comments
FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies para contact_messages
CREATE POLICY "Qualquer um pode inserir mensagens de contato" ON public.contact_messages
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins podem ver mensagens de contato" ON public.contact_messages
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar mensagens de contato" ON public.contact_messages
FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar mensagens de contato" ON public.contact_messages
FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies para newsletter_subscribers
CREATE POLICY "Admins podem ver assinantes" ON public.newsletter_subscribers
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Qualquer um pode se inscrever" ON public.newsletter_subscribers
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins podem atualizar assinantes" ON public.newsletter_subscribers
FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar assinantes" ON public.newsletter_subscribers
FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies para newsletter_campaigns
CREATE POLICY "Admins podem gerenciar campanhas" ON public.newsletter_campaigns
FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies para newsletter_templates
CREATE POLICY "Admins podem gerenciar templates" ON public.newsletter_templates
FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies para settings
CREATE POLICY "Admins podem gerenciar configurações" ON public.settings
FOR ALL USING (public.is_admin(auth.uid()));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar contador de comentários
CREATE OR REPLACE FUNCTION public.update_article_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.articles 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.articles 
        SET comments_count = GREATEST(comments_count - 1, 0) 
        WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_count AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_article_comments_count();

-- Inserir usuário admin padrão
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
    uuid_generate_v4(),
    'admin@radioradar.news',
    crypt('25896589Ba@23479612', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"username": "admin", "name": "Administrador"}'
) ON CONFLICT (email) DO NOTHING;

-- Inserir perfil do admin
INSERT INTO public.profiles (id, username, name, role)
SELECT id, 'admin', 'Administrador', 'admin'
FROM auth.users 
WHERE email = 'admin@radioradar.news' 
ON CONFLICT (username) DO NOTHING;

-- Inserir configurações padrão
INSERT INTO public.settings (category, key, value) VALUES
('comments', 'moderation_required', 'true'),
('comments', 'allow_replies', 'true'),
('comments', 'max_length', '500'),
('comments', 'blocked_emails', '[]'),
('comments', 'blocked_ips', '[]'),
('comments', 'auto_approve_keywords', '[]'),
('comments', 'auto_reject_keywords', '["spam", "fake", "bot"]'),
('newsletter', 'sender_name', '"Portal RadioRadar.news"'),
('newsletter', 'sender_email', '"noticias@radioradar.news"'),
('newsletter', 'reply_to_email', '"contato@radioradar.news"'),
('newsletter', 'subscription_form_enabled', 'true'),
('newsletter', 'double_opt_in', 'false'),
('newsletter', 'welcome_email_enabled', 'true'),
('newsletter', 'welcome_email_subject', '"Bem-vindo ao RadioRadar.news!"'),
('newsletter', 'welcome_email_content', '"Obrigado por se inscrever em nossa newsletter. Você receberá as melhores notícias em primeira mão!"'),
('newsletter', 'unsubscribe_footer', '"Você está recebendo este email porque se inscreveu em nossa newsletter. Para cancelar, clique aqui."'),
('newsletter', 'auto_send_enabled', 'true'),
('newsletter', 'auto_send_subject', '"Nova matéria publicada: {{title}}"'),
('newsletter', 'auto_send_template', '"Uma nova matéria foi publicada no Portal de Notícias!\n\n**{{title}}**\n\n{{excerpt}}\n\nLeia a matéria completa em: {{url}}"'),
('newsletter', 'auto_send_categories', '["Política", "Policial", "Entretenimento", "Internacional", "Esportes", "Tecnologia", "Ciência / Saúde"]')
ON CONFLICT (category, key) DO NOTHING;