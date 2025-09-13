-- Adicionar campo para armazenar senhas temporariamente visíveis
ALTER TABLE public.profiles 
ADD COLUMN temp_password TEXT;

-- Criar ou atualizar função para o super admin
CREATE OR REPLACE FUNCTION public.ensure_super_admin()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    super_admin_exists BOOLEAN;
    super_admin_id UUID;
BEGIN
    -- Verificar se o super admin já existe
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'adm@radioradar.news'
    ) INTO super_admin_exists;
    
    IF NOT super_admin_exists THEN
        -- Criar o super admin no auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            confirmation_sent_at,
            confirmation_token,
            recovery_sent_at,
            recovery_token,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'adm@radioradar.news',
            crypt('25896589Ba@23479612', gen_salt('bf')),
            now(),
            now(),
            '',
            null,
            '',
            '',
            '',
            null,
            null,
            '{"provider": "email", "providers": ["email"]}',
            '{"username": "admin", "name": "Super Administrador"}',
            false,
            now(),
            now(),
            null,
            null,
            '',
            '',
            null,
            '',
            0,
            null,
            '',
            null,
            false,
            null
        ) RETURNING id INTO super_admin_id;
        
        -- Criar o perfil correspondente
        INSERT INTO public.profiles (
            id,
            username,
            name,
            role,
            is_active,
            temp_password,
            created_at,
            updated_at
        ) VALUES (
            super_admin_id,
            'admin',
            'Super Administrador',
            'admin',
            true,
            '25896589Ba@23479612',
            now(),
            now()
        ) ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active,
            temp_password = EXCLUDED.temp_password,
            updated_at = now();
    ELSE
        -- Atualizar o perfil existente se necessário
        UPDATE public.profiles 
        SET 
            role = 'admin',
            is_active = true,
            temp_password = '25896589Ba@23479612',
            updated_at = now()
        WHERE id = (
            SELECT id FROM auth.users WHERE email = 'adm@radioradar.news'
        );
    END IF;
END;
$$;

-- Executar a função para garantir que o super admin existe
SELECT public.ensure_super_admin();

-- Criar função para atualizar senhas visíveis
CREATE OR REPLACE FUNCTION public.update_user_password(
    user_email TEXT,
    new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Buscar o ID do usuário
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar a senha no auth.users
    UPDATE auth.users 
    SET 
        encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = user_id;
    
    -- Atualizar a senha temporária visível no perfil
    UPDATE public.profiles 
    SET 
        temp_password = new_password,
        updated_at = now()
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$;