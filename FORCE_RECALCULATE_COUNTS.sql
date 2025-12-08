-- SOLUCIÓN DEFINITIVA PARA COMMENTS_COUNT
-- Este script FUERZA la actualización de todos los contadores

-- Paso 1: Asegurar que la columna existe
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Paso 2: FORZAR recalculación de TODOS los posts
UPDATE public.posts
SET comments_count = (
    SELECT COUNT(*)
    FROM public.comments
    WHERE comments.post_id = posts.id
);

-- Paso 3: FORZAR recalculación de TODOS los comentarios
UPDATE public.comments
SET likes_count = (
    SELECT COUNT(*)
    FROM public.comment_likes
    WHERE comment_likes.comment_id = comments.id
);

-- Paso 4: Verificar que funcionó
SELECT 
    'Posts con comentarios' as tipo,
    id,
    caption,
    comments_count as contador,
    (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as real
FROM public.posts
WHERE (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) > 0
ORDER BY created_at DESC;
