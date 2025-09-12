-- Atualizar o usuário existente para o super admin
UPDATE auth.users 
SET 
  email = 'admin@radioradar.news',
  encrypted_password = crypt('25896589Ba@23479612', gen_salt('bf')),
  raw_user_meta_data = '{"username": "admin", "name": "Administrador"}'
WHERE id = '8995cf66-2d9b-410c-a27f-b403e6c01096';

-- Atualizar o perfil para super admin
UPDATE public.profiles 
SET 
  username = 'admin',
  name = 'Administrador',
  role = 'admin',
  is_active = true
WHERE id = '8995cf66-2d9b-410c-a27f-b403e6c01096';