-- ============================================
-- SOLUCIÓN AGRESIVA: ELIMINAR TODO CON CASCADE
-- ============================================

-- PASO 1: Desactivar temporalmente los triggers
ALTER TABLE public.comments DISABLE TRIGGER ALL;
ALTER TABLE public.comment_likes DISABLE TRIGGER ALL;

-- PASO 2: Eliminar TODAS las funciones con CASCADE (esto elimina los triggers también)
DROP FUNCTION IF EXISTS public.update_posts_comments_count CASCADE;
DROP FUNCTION IF EXISTS public.update_comment_likes_count CASCADE;
DROP FUNCTION IF EXISTS public.handle_comment_count CASCADE;
DROP FUNCTION IF EXISTS public.handle_comment_like CASCADE;
DROP FUNCTION IF EXISTS public.increment_post_comments CASCADE;
DROP FUNCTION IF EXISTS public.decrement_post_comments CASCADE;

-- PASO 3: Verificar que NO hay triggers
SELECT 
    'DEBE SER 0' as mensaje,
    COUNT(*) as triggers_restantes
FROM information_schema.triggers
WHERE event_object_table IN ('comments', 'comment_likes');

-- PASO 4: Crear UNA función para comments_count
CREATE OR REPLACE FUNCTION public.update_posts_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts 
        SET comments_count = GREATEST(comments_count - 1, 0) 
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Crear UNA función para likes_count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.comments 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 6: Reactivar triggers
ALTER TABLE public.comments ENABLE TRIGGER ALL;
ALTER TABLE public.comment_likes ENABLE TRIGGER ALL;

-- PASO 7: Crear UN SOLO trigger para comments
DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_posts_comments_count();

-- PASO 8: Crear UN SOLO trigger para comment_likes
DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
CREATE TRIGGER on_comment_like_change
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- PASO 9: RECALCULAR contadores
UPDATE public.posts
SET comments_count = (
    SELECT COUNT(*)
    FROM public.comments
    WHERE comments.post_id = posts.id
);

UPDATE public.comments
SET likes_count = (
    SELECT COUNT(*)
    FROM public.comment_likes
    WHERE comment_likes.comment_id = comments.id
);

-- PASO 10: VERIFICACIÓN FINAL
SELECT 
    'TOTAL DE TRIGGERS (DEBE SER 2)' as verificacion,
    COUNT(*) as total
FROM information_schema.triggers
WHERE event_object_table IN ('comments', 'comment_likes');

SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('comments', 'comment_likes')
ORDER BY event_object_table, trigger_name;
