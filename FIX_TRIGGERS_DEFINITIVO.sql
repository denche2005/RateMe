-- ================================================
-- SOLUCIÓN DEFINITIVA - TRIGGERS DE CONTADORES
-- ================================================

-- PASO 1: Eliminar triggers antiguos si existen
DROP TRIGGER IF EXISTS saves_count_trigger ON saved_posts;
DROP TRIGGER IF EXISTS reposts_count_trigger ON reposts;
DROP TRIGGER IF EXISTS comments_count_trigger ON comments;

-- PASO 2: Eliminar funciones antiguas
DROP FUNCTION IF EXISTS update_saves_count();
DROP FUNCTION IF EXISTS update_reposts_count();
DROP FUNCTION IF EXISTS update_comments_count();

-- ================================================
-- PASO 3: CREAR FUNCIONES NUEVAS
-- ================================================

-- Función para SAVES
CREATE OR REPLACE FUNCTION update_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET saves_count = COALESCE(saves_count, 0) + 1 
    WHERE id = NEW.post_id;
    RAISE NOTICE 'SAVES: Incrementado para post %', NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET saves_count = GREATEST(COALESCE(saves_count, 0) - 1, 0) 
    WHERE id = OLD.post_id;
    RAISE NOTICE 'SAVES: Decrementado para post %', OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para REPOSTS
CREATE OR REPLACE FUNCTION update_reposts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET reposts_count = COALESCE(reposts_count, 0) + 1 
    WHERE id = NEW.post_id;
    RAISE NOTICE 'REPOSTS: Incrementado para post %', NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET reposts_count = GREATEST(COALESCE(reposts_count, 0) - 1, 0) 
    WHERE id = OLD.post_id;
    RAISE NOTICE 'REPOSTS: Decrementado para post %', OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para COMMENTS
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comments_count = COALESCE(comments_count, 0) + 1 
    WHERE id = NEW.post_id;
    RAISE NOTICE 'COMMENTS: Incrementado para post %', NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) 
    WHERE id = OLD.post_id;
    RAISE NOTICE 'COMMENTS: Decrementado para post %', OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- PASO 4: CREAR TRIGGERS
-- ================================================

CREATE TRIGGER saves_count_trigger
AFTER INSERT OR DELETE ON saved_posts
FOR EACH ROW EXECUTE FUNCTION update_saves_count();

CREATE TRIGGER reposts_count_trigger
AFTER INSERT OR DELETE ON reposts
FOR EACH ROW EXECUTE FUNCTION update_reposts_count();

CREATE TRIGGER comments_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- ================================================
-- PASO 5: RECALCULAR CONTADORES EXISTENTES
-- ================================================

-- Resetear todos los contadores a 0 primero
UPDATE posts SET saves_count = 0, reposts_count = 0, comments_count = 0;

-- Recalcular saves_count
UPDATE posts p
SET saves_count = (
  SELECT COUNT(*) 
  FROM saved_posts sp 
  WHERE sp.post_id = p.id
);

-- Recalcular reposts_count
UPDATE posts p
SET reposts_count = (
  SELECT COUNT(*) 
  FROM reposts r 
  WHERE r.post_id = p.id
);

-- Recalcular comments_count
UPDATE posts p
SET comments_count = (
  SELECT COUNT(*) 
  FROM comments c 
  WHERE c.post_id = p.id
);

-- ================================================
-- PASO 6: VERIFICAR
-- ================================================

-- Ver triggers creados
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('saved_posts', 'reposts', 'comments')
ORDER BY event_object_table, trigger_name;

-- Ver contadores actuales
SELECT 
  id, 
  caption,
  saves_count,
  reposts_count,
  comments_count
FROM posts 
ORDER BY created_at DESC 
LIMIT 10;

-- ================================================
-- PASO 7: PROBAR (EJECUTA ESTO DESPUÉS)
-- ================================================

-- Inserta un save de prueba (reemplaza los IDs)
-- INSERT INTO saved_posts (post_id, user_id) 
-- VALUES ('TU_POST_ID', 'TU_USER_ID');

-- Verifica que el contador subió
-- SELECT id, saves_count FROM posts WHERE id = 'TU_POST_ID';
