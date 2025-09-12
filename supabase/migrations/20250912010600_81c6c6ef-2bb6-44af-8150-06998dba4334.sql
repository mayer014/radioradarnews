-- Limpar todos os usuários existentes
DELETE FROM auth.users;

-- Inserir o usuário super admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@radioradar.news',
  crypt('25896589Ba@23479612', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "admin", "name": "Administrador"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Criar o perfil do super admin
INSERT INTO public.profiles (id, username, name, role, is_active)
SELECT 
  id, 
  'admin', 
  'Administrador', 
  'admin'::user_role, 
  true
FROM auth.users 
WHERE email = 'admin@radioradar.news';