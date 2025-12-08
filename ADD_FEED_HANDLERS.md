# Feed Features - Handlers Implementation

## AÑADIR DESPUÉS DE LA LÍNEA ~770 en index.tsx

Busca el final de la función que maneja el streak modal (alrededor de línea 760-770) y añade estos handlers:

```typescript
  // ================================================
  // FEED FEATURES HANDLERS
  // ================================================

  const handleSaveClick = async (post: Post) => {
    try {
      const isSaved = await toggleSave(post.id, currentUserId);
      
      // Reload post to get updated saves_count
      const updatedPost = await getPostById(post.id);
      if (updatedPost) {
        setPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));
      }
      
      setToastMessage(isSaved ? '📌 Post saved!' : 'Post unsaved');
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleRepostClick = async (post: Post) => {
    try {
      const isReposted = await toggleRepost(post.id, currentUserId);
      
      // Reload post to get updated reposts_count
      const updatedPost = await getPostById(post.id);
      if (updatedPost) {
        setPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));
      }
      
      setToastMessage(isReposted ? '🔄 Reposted!' : 'Repost removed');
    } catch (error) {
      console.error('Error reposting:', error);
    }
  };

  const handleCommentClick = (post: Post) => {
    // TODO: Open comments modal
    console.log('Comments for post:', post.id);
    setToastMessage('Comments feature coming soon!');
  };
```

## LUEGO BUSCA DONDE SE PASA onSaveClick, onRepostClick

Busca en el código donde se renderiza el Feed component (alrededor de línea 1100-1150) y verifica que los handlers estén conectados:

```typescript
<Feed
  ...
  onSaveClick={handleSaveClick}
  onRepostClick={handleRepostClick}
  onCommentClick={handleCommentClick}
  ...
/>
```

Si no están, añádelos a las props del Feed component.

## DESPUÉS PRUEBA:

1. Click en Save → Post se guarda
2. Click en Repost → Post se repostea
3. Contadores se actualizan al instante
