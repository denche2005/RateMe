-- ============================================
-- SOLUCIÓN FINAL: Solo tocar NUESTROS triggers
-- ============================================

-- PASO 1: Eliminar solo NUESTROS triggers específicos
DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
DROP TRIGGER IF EXISTS comments_count_trigger ON public.comments;

-- PASO 2: Eliminar las funciones (esto elimina los triggers asociados automáticamente)
DROP FUNCTION IF EXISTS public.update_posts_comments_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_comment_likes_count() CASCADE;

-- PASO 3: Esperar un momento para que Supabase procese
SELECT pg_sleep(1);

-- PASO 4: Verificar que NO hay triggers personalizados (solo deben quedar los del sistema)
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('comments', 'comment_likes')
  AND trigger_name NOT LIKE 'RI_%'  -- Excluir triggers del sistema
ORDER BY event_object_table, trigger_name;

-- PASO 5: Crear función NUEVA para comments_count
CREATE FUNCTION public.update_posts_comments_count()
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

-- PASO 6: Crear función NUEVA para likes_count
CREATE FUNCTION public.update_comment_likes_count()
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

-- PASO 7: Crear UN trigger para comments
CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_posts_comments_count();

-- PASO 8: Crear UN trigger para comment_likes
CREATE TRIGGER on_comment_like_change
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- PASO 9: RECALCULAR contadores para arreglar duplicaciones
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

-- PASO 10: VERIFICACIÓN FINAL (excluir triggers del sistema)
SELECT 
    'TRIGGERS PERSONALIZADOS (DEBE SER 2)' as tipo,
    COUNT(*) as total
FROM information_schema.triggers
WHERE event_object_table IN ('comments', 'comment_likes')
  AND trigger_name NOT LIKE 'RI_%';

SELECT 
    trigger_name,
    event_object_table,
    'DEBE APARECER SOLO UNA VEZ' as status
FROM information_schema.triggers
WHERE event_object_table IN ('comments', 'comment_likes')
  AND trigger_name NOT LIKE 'RI_%'
ORDER BY event_object_table, trigger_name;
