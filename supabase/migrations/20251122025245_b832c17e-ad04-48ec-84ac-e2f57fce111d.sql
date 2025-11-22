-- Corrigir author_id de artigos de colunistas
-- Quando um artigo tem columnist_id, o author_id deve ser o mesmo que o columnist_id

UPDATE articles 
SET author_id = columnist_id::uuid
WHERE columnist_id IS NOT NULL 
  AND columnist_id::uuid != author_id;