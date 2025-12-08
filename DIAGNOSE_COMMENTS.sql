-- SCRIPT DE DIAGNÓSTICO
-- Ejecuta esto en Supabase SQL Editor para ver qué está pasando

-- 1. Verificar si la columna comments_count existe
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name = 'posts' 
AND column_name = 'comments_count';

-- 2. Ver los valores actuales de comments_count en posts
SELECT 
    id,
    caption,
    comments_count,
    (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as actual_count
FROM posts
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar si los triggers existen
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('on_comment_change', 'on_comment_like_change');

-- 4. Ver comentarios existentes
SELECT 
    c.id,
    c.post_id,
    c.text,
    c.likes_count,
    (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as actual_likes
FROM comments c
ORDER BY c.created_at DESC
LIMIT 10;
