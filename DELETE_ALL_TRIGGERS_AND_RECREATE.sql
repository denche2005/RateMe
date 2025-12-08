-- ============================================
-- ELIMINAR TODOS LOS TRIGGERS DUPLICADOS
-- ============================================

-- PASO 1: Eliminar TODOS los triggers de comments
DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
DROP TRIGGER IF EXISTS comments_count_trigger ON public.comments;
DROP TRIGGER IF EXISTS update_comment_count ON public.comments;
DROP TRIGGER IF EXISTS increment_comments_count ON public.comments;

-- PASO 2: Eliminar TODOS los triggers de comment_likes
DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
DROP TRIGGER IF EXISTS update_comment_likes ON public.comment_likes;
DROP TRIGGER IF EXISTS increment_comment_likes ON public.comment_likes;

-- PASO 3: Eliminar TODAS las funciones trigger
DROP FUNCTION IF EXISTS public.update_posts_comments_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_comment_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.handle_comment_count() CASCADE;
DROP FUNCTION IF EXISTS public.handle_comment_like() CASCADE;

-- PASO 4: Crear UNA SOLA función para comments_count
CREATE FUNCTION public.update_posts_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts 
        SET comments_count = GREATEST(comments_count - 1, 0) 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Crear UNA SOLA función para likes_count
CREATE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.comments 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 6: Crear UN SOLO trigger para comments
CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_posts_comments_count();

-- PASO 7: Crear UN SOLO trigger para comment_likes
CREATE TRIGGER on_comment_like_change
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- PASO 8: RECALCULAR todos los contadores (arreglar duplicaciones)
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

-- PASO 9: VERIFICAR que solo hay 1 trigger por tabla
SELECT 
    'DEBE HABER SOLO 2 TRIGGERS EN TOTAL' as mensaje,
    COUNT(*) as total_triggers
FROM information_schema.triggers
WHERE event_object_table IN ('comments', 'comment_likes');

-- Mostrar los triggers que quedaron
SELECT 
    trigger_name,
    event_object_table,
    'DEBE SER ÚNICO' as status
FROM information_schema.triggers
WHERE event_object_table IN ('comments', 'comment_likes')
ORDER BY event_object_table, trigger_name;
