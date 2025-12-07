-- ============================================
-- SOLUCIÓN FINAL: UN SOLO TRIGGER
-- ============================================
-- Combinar ambos en una función para garantizar orden correcto

-- Borrar triggers separados
DROP TRIGGER IF EXISTS trigger_update_post_rating ON ratings;
DROP TRIGGER IF EXISTS trigger_recalculate_user_stats ON ratings;
DROP FUNCTION IF EXISTS update_post_rating() CASCADE;
DROP FUNCTION IF EXISTS recalculate_user_stats() CASCADE;

-- CREAR UNA SOLA FUNCIÓN que hace AMBAS cosas en orden
CREATE OR REPLACE FUNCTION handle_rating_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    target_user_id UUID;
    post_avg NUMERIC;
    post_count INTEGER;
    user_avg NUMERIC;
    user_post_count INTEGER;
BEGIN
    -- PASO 1: Actualizar el POST (si es rating de post)
    IF NEW.target_type = 'post' THEN
        -- Calcular average del post
        SELECT 
            COALESCE(AVG(value), 0),
            COUNT(*)
        INTO post_avg, post_count
        FROM ratings
        WHERE target_id = NEW.target_id AND target_type = 'post';
        
        -- Actualizar post
        UPDATE posts
        SET 
            average_rating = post_avg,
            rating_count = post_count
        WHERE id = NEW.target_id;
        
        -- PASO 2: Obtener el creador del post
        SELECT creator_id INTO target_user_id
        FROM posts
        WHERE id = NEW.target_id;
        
    ELSIF NEW.target_type = 'user' THEN
        -- Rating directo de usuario
        target_user_id := NEW.target_id;
    ELSE
        RETURN NEW;
    END IF;

    -- PASO 3: Actualizar el PERFIL del usuario
    IF target_user_id IS NOT NULL THEN
        -- Calcular average de TODOS los posts del usuario
        -- IMPORTANTE: Esto lee los valores YA ACTUALIZADOS del PASO 1
        SELECT 
            COALESCE(AVG(average_rating), 0),
            COUNT(*)
        INTO user_avg, user_post_count
        FROM posts
        WHERE creator_id = target_user_id;
        
        -- Actualizar perfil
        UPDATE profiles
        SET 
            average_score = user_avg,
            posts_count = user_post_count
        WHERE id = target_user_id;
    END IF;

    RETURN NEW;
END;
$$;

-- CREAR UN SOLO TRIGGER
CREATE TRIGGER trigger_handle_rating_change
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION handle_rating_change();

-- VERIFICAR
SELECT 
    tgname,
    tgenabled,
    CASE tgenabled
        WHEN 'O' THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status
FROM pg_trigger
WHERE tgname = 'trigger_handle_rating_change';

SELECT 
    proname,
    prosecdef,
    CASE prosecdef
        WHEN true THEN '✅ HAS SECURITY DEFINER'
        ELSE '❌ NO SECURITY DEFINER'
    END as status
FROM pg_proc
WHERE proname = 'handle_rating_change';

-- RECALCULAR MANUALMENTE AHORA para arreglar el 1.8
UPDATE profiles
SET 
    average_score = (
        SELECT COALESCE(AVG(average_rating), 0)
        FROM posts
        WHERE creator_id = profiles.id
    ),
    posts_count = (
        SELECT COUNT(*)
        FROM posts
        WHERE creator_id = profiles.id
    );

-- VERIFICAR RESULTADO
SELECT username, average_score, posts_count
FROM profiles
WHERE username = 'test3';

/*
RESULTADO ESPERADO:
- average_score = 4.0 (promedio de 3.5 y 4.5)
- posts_count = 2

PROBAR:
1. Recarga app
2. Califica un post diferente
3. Debería actualizarse correctamente ahora
*/
