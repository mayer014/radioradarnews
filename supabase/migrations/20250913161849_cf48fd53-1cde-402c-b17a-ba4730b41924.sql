-- Ativar o banner de política
UPDATE banners_normalized 
SET active = true, updated_at = now() 
WHERE id = '6bb8c690-829e-40ca-ba8c-409740223749';