-- ================================================
-- SOLUCIÓN RLS - SECURITY DEFINER
-- ================================================

-- El problema es que el usuario normal no puede hacer UPDATE en posts de otros.
-- Solución: Ejecutar la función con permisos de superusuario (SECURITY DEFINER).

-- 1. Función para SAVES (con SECURITY DEFINER)
CREATE OR REPLACE FUNCTION update_saves_count()
RETURNS TRIGGER 
SECURITY DEFINER -- <--- ESTO ES LA CLAVE
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET saves_count = COALESCE(saves_count, 0) + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET saves_count = GREATEST(COALESCE(saves_count, 0) - 1, 0) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para REPOSTS (con SECURITY DEFINER)
CREATE OR REPLACE FUNCTION update_reposts_count()
RETURNS TRIGGER 
SECURITY DEFINER -- <--- ESTO ES LA CLAVE
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET reposts_count = COALESCE(reposts_count, 0) + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET reposts_count = GREATEST(COALESCE(reposts_count, 0) - 1, 0) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para COMMENTS (con SECURITY DEFINER)
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER 
SECURITY DEFINER -- <--- ESTO ES LA CLAVE
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comments_count = COALESCE(comments_count, 0) + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Recalcular contadores (para arreglar el estado actual)
UPDATE posts p
SET saves_count = (SELECT COUNT(*) FROM saved_posts sp WHERE sp.post_id = p.id),
    reposts_count = (SELECT COUNT(*) FROM reposts r WHERE r.post_id = p.id);
