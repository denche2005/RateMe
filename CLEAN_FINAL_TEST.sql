-- ============================================
-- LIMPIEZA FINAL PARA PRUEBA DE 0
-- ============================================

DELETE FROM ratings;
DELETE FROM posts;
UPDATE profiles SET average_score = 0, posts_count = 0;

-- Verificar limpio
SELECT 'LIMPIO ✅' as status, 
       (SELECT COUNT(*) FROM posts) as posts,
       (SELECT COUNT(*) FROM ratings) as ratings;

SELECT username, average_score, posts_count 
FROM profiles 
WHERE username IN ('test2', 'test3')
ORDER BY username;
