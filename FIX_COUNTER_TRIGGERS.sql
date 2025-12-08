-- ================================================
-- VERIFICAR Y ARREGLAR TRIGGERS DE CONTADORES
-- ================================================

-- 1. Verificar si los triggers existen
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('saved_posts', 'reposts', 'comments');

-- 2. Verificar contadores actuales en posts
SELECT id, caption, saves_count, reposts_count, comments_count 
FROM posts 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar datos en saved_posts y reposts
SELECT 'saved_posts' as table_name, COUNT(*) as count FROM saved_posts
UNION ALL
SELECT 'reposts' as table_name, COUNT(*) as count FROM reposts;

-- ================================================
-- SI NO HAY TRIGGERS, EJECUTA ESTO:
-- ================================================

-- SAVES COUNTER TRIGGER
CREATE OR REPLACE FUNCTION update_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS saves_count_trigger ON saved_posts;
CREATE TRIGGER saves_count_trigger
AFTER INSERT OR DELETE ON saved_posts
FOR EACH ROW EXECUTE FUNCTION update_saves_count();

-- REPOSTS COUNTER TRIGGER
CREATE OR REPLACE FUNCTION update_reposts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET reposts_count = GREATEST(reposts_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reposts_count_trigger ON reposts;
CREATE TRIGGER reposts_count_trigger
AFTER INSERT OR DELETE ON reposts
FOR EACH ROW EXECUTE FUNCTION update_reposts_count();

-- COMMENTS COUNTER TRIGGER
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_count_trigger ON comments;
CREATE TRIGGER comments_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- ================================================
-- RECALCULAR CONTADORES EXISTENTES (OPCIONAL)
-- ================================================

-- Recalcular saves_count para todos los posts
UPDATE posts p
SET saves_count = (
  SELECT COUNT(*) 
  FROM saved_posts sp 
  WHERE sp.post_id = p.id
);

-- Recalcular reposts_count para todos los posts
UPDATE posts p
SET reposts_count = (
  SELECT COUNT(*) 
  FROM reposts r 
  WHERE r.post_id = p.id
);

-- Verificar que se actualizaron
SELECT id, caption, saves_count, reposts_count 
FROM posts 
WHERE saves_count > 0 OR reposts_count > 0;
