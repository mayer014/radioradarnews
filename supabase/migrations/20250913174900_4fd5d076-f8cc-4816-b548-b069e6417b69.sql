-- Habilitar proteção contra senhas vazadas para resolver o warning de segurança
UPDATE auth.config 
SET 
  password_requirements = jsonb_build_object(
    'min_length', 6,
    'require_uppercase', false,
    'require_lowercase', false, 
    'require_digits', false,
    'require_special_characters', false
  ),
  password_leaked_check = true
WHERE NOT EXISTS (SELECT 1 FROM auth.config WHERE password_leaked_check = true);