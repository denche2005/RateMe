# SCRIPT COMPLETO - Fix Instant UI Updates

## PASO 1: Abrir index.tsx

Busca la función `handleFeedRate` (debería empezar en línea ~650)

## PASO 2: BORRAR TODO desde línea 650 hasta línea 730

Borra TODA la función `handleFeedRate` completa.

## PASO 3: PEGAR ESTE CÓDIGO en su lugar:

```typescript
  const handleFeedRate = async (post: Post, score: number) => {
    // Save rating to Supabase (UPSERT allows re-rating)
    try {
      const result = await createRating({
        raterId: currentUserId,
        targetId: post.id,
        targetType: 'post',
        value: score,
      });

      if (result.success) {
        console.log('[POST_RATING] Rating saved successfully');
        
        // Create notification
        await createNotification({
          type: 'RATING',
          raterId: currentUserId,
          raterName: currentUser.displayName,
          score: score,
          emoji: score >= 4 ? '🔥' : score >= 3 ? '👍' : '⭐',
          postId: post.id,
          postMediaUrl: post.mediaUrl,
        });

        // ✅ INSTANT UPDATE: Reload post with new average_rating from Supabase
        const updatedPost = await getPostById(post.id);
        if (updatedPost) {
          console.log('[POST_RATING] Post reloaded, new average:', updatedPost.averageRating);
          setPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));
          
          // Update viewing post if open
          if (viewingPost && viewingPost.id === post.id) {
            setViewingPost(updatedPost);
          }
        }

        // ✅ INSTANT UPDATE: Reload creator profile with new averageScore
        const creator = users.find(u => u.id === post.creatorId);
        if (creator) {
          const updatedCreator = await getUserById(creator.id);
          if (updatedCreator) {
            console.log('[POST_RATING] Creator reloaded, new score:', updatedCreator.averageScore);
            setUsers(prev => prev.map(u => u.id === creator.id ? updatedCreator : u));
          }
        }
      } else {
        console.warn('[POST_RATING] Failed:', result.error);
      }
    } catch (error) {
      console.error('[POST_RATING] Error:', error);
    }

    // Update local userPostRatings map
    setUserPostRatings(prev => ({ ...prev, [post.id]: score }));
  };
```

## PASO 4: Guardar

Guarda el archivo. La app recargará automáticamente.

## PASO 5: Probar

1. Puntúa un post → Se actualiza al instante
2. Vuelve a puntuar el MISMO post → Se actualiza al instante (sin refresh)
3. Abre perfil del creador → Ya tiene nueva media

**LOGS ESPERADOS:**
```
[POST_RATING] Rating saved successfully
[POST_RATING] Post reloaded, new average: 4.5
[POST_RATING] Creator reloaded, new score: 4.2
```

¡YA NO NECESITA REFRESH! 🚀
