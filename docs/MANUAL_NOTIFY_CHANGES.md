# Cambios Manuales Requeridos en index.tsx

## CAMBIO 1: Línea 371
**BUSCA:**
```typescript
const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
```

**REEMPLAZA CON:**
```typescript
const [notifications, setNotifications] = useState<Notification[]>([]);
```

---

## CAMBIO 2: Después de línea 530 (después del useEffect de profile updates)

**AÑADE ESTE CÓDIGO COMPLETO:**
```typescript
  // Load notifications from Supabase
  useEffect(() => {
    if (authenticatedUser) {
      const loadNotifications = async () => {
        console.log('[NOTIFICATIONS] Loading from Supabase...');
        const realNotifs = await getUserNotifications(authenticatedUser.id);
        console.log('[NOTIFICATIONS] Loaded', realNotifs.length, 'notifications');
        setNotifications(realNotifs);
      };
      loadNotifications();
    }
  }, [authenticatedUser]);
```

---

## UBICACIÓN EXACTA:

Busca esta sección (alrededor de línea 515-530):
```typescript
  // Real-time profile updates subscription (for badge averages)
  useEffect(() => {
    if (authenticatedUser) {
      const unsubscribe = subscribeToProfileUpdates(
        authenticatedUser.id,
        async (updatedProfile) => {
          console.log('[APP] Profile updated via realtime:', updatedProfile.badge_averages);
          
          // Reload full user data
          const updatedUser = await getUserById(authenticatedUser.id);
          if (updatedUser) {
            setUsers(prev => prev.map(u => u.id === authenticatedUser.id ? updatedUser : u));
          }
        }
      );
      
      return unsubscribe;
    }
  }, [authenticatedUser]);

  // ← AÑADIR EL CÓDIGO DE ARRIBA AQUÍ

  const calculateMultiplier = (streak: number) => 1 + (streak * 0.05);
```

---

## ✅ DESPUÉS DE HACER LOS CAMBIOS:

1. Guarda el archivo
2. La app recargará automáticamente
3. Abre la consola
4. Deberías ver:
   - `[NOTIFICATIONS] Loading from Supabase...`
   - `[NOTIFICATIONS] Loaded X notifications`
   - `[REALTIME] Subscribing to notifications for user: ...`
   - `[REALTIME] Subscription status: SUBSCRIBED`

**Avísame cuando hayas hecho los cambios!** 🚀
