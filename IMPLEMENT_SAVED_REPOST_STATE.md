# IMPLEMENTAR ESTADO DE SAVED/REPOST

## PASO 1: Ejecutar SQL en Supabase

Abre `UPDATE_NOTIFICATIONS_CONSTRAINT.sql` y ejecútalo en Supabase SQL Editor.

Esto permite los tipos SAVED y REPOSTED en notificaciones.

---

## PASO 2: Añadir useEffect en index.tsx

**BUSCA** (línea ~573):
```typescript
  }, [authenticatedUser]);

  const calculateMultiplier = (streak: number) => 1 + (streak * 0.05);
```

**REEMPLAZA CON:**
```typescript
  }, [authenticatedUser]);

  // Load saved posts and reposts IDs
  useEffect(() => {
    const loadSavedAndRepostedState = async () => {
      if (!authenticatedUser) return;

      const savedIds = await getUserSavedPosts(authenticatedUser.id);
      setSavedPostIds(savedIds);
      console.log('[SAVED] Loaded saved posts:', savedIds.length);

      const repostedIds = await getUserReposts(authenticatedUser.id);
      setRepostedPostIds(repostedIds);
      console.log('[REPOST] Loaded reposts:', repostedIds.length);
    };

    loadSavedAndRepostedState();
  }, [authenticatedUser]);

  const calculateMultiplier = (streak: number) => 1 + (streak * 0.05);
```

---

## PASO 3: Actualizar handleSaveClick (línea ~786)

**BUSCA:**
```typescript
      setToastMessage(isSaved ? '📌 Post saved!' : 'Post unsaved');
    } catch (error) {
```

**REEMPLAZA CON:**
```typescript
      // Update local state
      if (isSaved) {
        setSavedPostIds(prev => [...prev, post.id]);
      } else {
        setSavedPostIds(prev => prev.filter(id => id !== post.id));
      }

      setToastMessage(isSaved ? '📌 Post saved!' : 'Post unsaved');
    } catch (error) {
```

---

## PASO 4: Actualizar handleRepostClick (línea ~815)

**BUSCA:**
```typescript
      setToastMessage(isReposted ? '🔄 Reposted!' : 'Repost removed');
    } catch (error) {
```

**REEMPLAZA CON:**
```typescript
      // Update local state
      if (isReposted) {
        setRepostedPostIds(prev => [...prev, post.id]);
      } else {
        setRepostedPostIds(prev => prev.filter(id => id !== post.id));
      }

      setToastMessage(isReposted ? '🔄 Reposted!' : 'Repost removed');
    } catch (error) {
```

---

## PASO 5: Pasar estado al Feed component (línea ~1199)

**BUSCA:**
```typescript
            <Feed
              posts={posts}
              users={users}
              comments={comments}
              ratingScale={ratingScale}
              onRate={handleFeedRate}
```

**AÑADE ESTAS PROPS:**
```typescript
            <Feed
              posts={posts}
              users={users}
              comments={comments}
              ratingScale={ratingScale}
              savedPostIds={savedPostIds}
              repostedPostIds={repostedPostIds}
              onRate={handleFeedRate}
```

---

## RESULTADO:

1. ✅ Al abrir app, carga qué posts guardaste/reposteaste
2. ✅ Botones aparecen activos si ya guardaste/reposteaste
3. ✅ Estado se mantiene después de toggle
4. ✅ Notificaciones funcionan (después de ejecutar SQL)
