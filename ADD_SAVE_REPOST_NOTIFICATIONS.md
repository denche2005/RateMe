# AÑADIR NOTIFICACIONES A HANDLERS

## PASO 1: handleSaveClick (línea ~770)

**BUSCA:**
```typescript
      }
      
      setToastMessage(isSaved ? '📌 Post saved!' : 'Post unsaved');
```

**REEMPLAZA CON:**
```typescript
      }
      
      // Create notification if saving someone else's post
      if (isSaved && post.creatorId !== currentUserId) {
        await createNotification({
          type: 'SAVED',
          raterId: currentUserId,
          raterName: currentUser.displayName,
          score: 0,
          emoji: '🔖',
          postId: post.id,
          postMediaUrl: post.mediaUrl,
        });
      }
      
      setToastMessage(isSaved ? '📌 Post saved!' : 'Post unsaved');
```

---

## PASO 2: handleRepostClick (línea ~786)

**BUSCA:**
```typescript
      }
      
      setToastMessage(isReposted ? '🔄 Reposted!' : 'Repost removed');
```

**REEMPLAZA CON:**
```typescript
      }
      
      // Create notification if reposting someone else's post
      if (isReposted && post.creatorId !== currentUserId) {
        await createNotification({
          type: 'REPOSTED',
          raterId: currentUserId,
          raterName: currentUser.displayName,
          score: 0,
          emoji: '🔄',
          postId: post.id,
          postMediaUrl: post.mediaUrl,
        });
      }
      
      setToastMessage(isReposted ? '🔄 Reposted!' : 'Repost removed');
```

---

## RESULTADO:

Ahora cuando alguien guarda o repostea TU post, recibirás una notificación (excepto si eres tú mismo).

**Toast popup:**
- "🔖 test2 saved your post!"
- "🔄 test2 reposted your post!"
