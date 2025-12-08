-- ============================================
-- BADGE AVERAGES - SOLUCIÓN COMPLETA
-- ============================================
-- Este script arregla el sistema de badge averages (Radar Chart)
-- para que funcione con Supabase

-- PROBLEMA ACTUAL:
-- - FINAL_FINAL_TRIGGER.sql sobrescribió el trigger de badge_averages
-- - Solo maneja ratings de posts, NO de users (Describe Me)
-- - Badge averages se pierden al refrescar

-- SOLUCIÓN:
-- - Un solo trigger que maneja AMBOS: posts Y users
-- - Actualiza average_rating para posts
-- - Actualiza badge_averages para users

-- ============================================
-- PASO 1: Borrar trigger antiguo
-- ============================================

DROP TRIGGER IF EXISTS trigger_handle_rating_change ON ratings;
DROP FUNCTION IF EXISTS handle_rating_change() CASCADE;

-- ============================================
-- PASO 2: Crear trigger nuevo que maneja TODO
-- ============================================

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
    -- ======================================
    -- CASO 1: RATING DE POST
    -- ======================================
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
        
        -- Obtener el creador del post
        SELECT creator_id INTO target_user_id
        FROM posts
        WHERE id = NEW.target_id;
        
        -- Actualizar perfil del creador (average_score basado en posts)
        IF target_user_id IS NOT NULL THEN
            SELECT 
                COALESCE(AVG(average_rating), 0),
                COUNT(*)
            INTO user_avg, user_post_count
            FROM posts
            WHERE creator_id = target_user_id;
            
            UPDATE profiles
            SET 
                average_score = user_avg,
                posts_count = user_post_count
            WHERE id = target_user_id;
        END IF;
    
    -- ======================================
    -- CASO 2: RATING DE USER (DESCRIBE ME)
    -- ======================================
    ELSIF NEW.target_type = 'user' THEN
        target_user_id := NEW.target_id;
        
        -- Actualizar badge_averages SOLO si hay badges en el rating
        IF NEW.badges IS NOT NULL THEN
            UPDATE profiles
            SET 
                badge_averages = (
                    SELECT COALESCE(
                        jsonb_build_object(
                            'Intelligence', COALESCE(ROUND(AVG((badges->>'Intelligence')::numeric), 2), 0),
                            'Charisma', COALESCE(ROUND(AVG((badges->>'Charisma')::numeric), 2), 0),
                            'Affectionate', COALESCE(ROUND(AVG((badges->>'Affectionate')::numeric), 2), 0),
                            'Humor', COALESCE(ROUND(AVG((badges->>'Humor')::numeric), 2), 0),
                            'Active', COALESCE(ROUND(AVG((badges->>'Active')::numeric), 2), 0),
                            'Extroverted', COALESCE(ROUND(AVG((badges->>'Extroverted')::numeric), 2), 0)
                        ),
                        '{"Intelligence": 0, "Charisma": 0, "Affectionate": 0, "Humor": 0, "Active": 0, "Extroverted": 0}'::jsonb
                    )
                    FROM ratings
                    WHERE target_id = target_user_id 
                    AND target_type = 'user' 
                    AND badges IS NOT NULL
                ),
                total_ratings = (
                    SELECT COUNT(*)
                    FROM ratings
                    WHERE target_id = target_user_id AND target_type = 'user'
                )
            WHERE id = target_user_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================
-- PASO 3: Crear trigger
-- ============================================

CREATE TRIGGER trigger_handle_rating_change
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION handle_rating_change();

-- ============================================
-- PASO 4: Verificar que funcione
-- ============================================

-- Ver trigger
SELECT 
    tgname,
    tgenabled,
    CASE tgenabled
        WHEN 'O' THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as status
FROM pg_trigger
WHERE tgname = 'trigger_handle_rating_change';

-- Ver función
SELECT 
    proname,
    prosecdef,
    CASE prosecdef
        WHEN true THEN '✅ HAS SECURITY DEFINER'
        ELSE '❌ NO SECURITY DEFINER'
    END as status
FROM pg_proc
WHERE proname = 'handle_rating_change';

-- ============================================
-- PASO 5: Resetear badge_averages existentes
-- ============================================

-- Resetear badge_averages a 0 para todos los usuarios
UPDATE profiles
SET badge_averages = '{"Intelligence": 0, "Charisma": 0, "Affectionate": 0, "Humor": 0, "Active": 0, "Extroverted": 0}'::jsonb
WHERE id IN (SELECT id FROM profiles);

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

/*
✅ Trigger creado con SECURITY DEFINER
✅ Maneja ratings de POSTS (average_rating)
✅ Maneja ratings de USERS (badge_averages)
✅ Badge averages se guardan en Supabase
✅ Radar chart lee valores reales de DB

PRÓXIMOS PASOS:
1. Ejecutar este SQL completo en Supabase
2. Modificar frontend para enviar badges correctamente
3. Probar "Describe Me" → valores deben persistir
*/
