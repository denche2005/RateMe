# Mejoras de UI para Notificaciones - ChatsView.tsx

## UBICACIÓN: `components/ChatsView.tsx` líneas 733-780

Reemplaza TODA la sección de Activity (desde línea 733 hasta 780) con esto:

```tsx
        {activeTab === 'ACTIVITY' && (
           <div className="px-2">
             {notifications.map(notif => {
                const user = users.find(u => u.id === notif.raterId);
                const isDescribed = notif.type === 'DESCRIBED';

                return (
                  <div 
                    key={notif.id} 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-theme-text/5 transition-colors group mb-2 border border-theme-divider/50"
                  >
                       {/* Avatar izquierda - Click va a perfil del rater */}
                       <div 
                         onClick={() => user && onProfileClick(user)}
                         className="relative cursor-pointer hover:scale-105 transition-transform"
                       >
                         <Avatar url={user ? user.avatarUrl : ''} size="md" />
                         <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-gradient rounded-full flex items-center justify-center text-[10px] text-white shadow-sm border border-theme-bg">
                            {isDescribed ? '✨' : '★'}
                         </div>
                       </div>
                       
                       {/* Texto medio - Click muestra detalles */}
                       <div 
                         className="flex-1 cursor-pointer"
                         onClick={() => {
                           if (isDescribed && onNotificationClick) {
                             onNotificationClick(notif);
                           }
                         }}
                       >
                          <p className="text-sm text-theme-text">
                            <span className="font-bold">{notif.raterName}</span> 
                            {isDescribed ? ' described you!' : ' rated your post!'}
                          </p>
                          <span className="text-[10px] text-theme-secondary">
                             {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                       
                       {/* Derecha - Post miniatura O Radar */}
                       {isDescribed ? (
                         // DESCRIBED: Radar (click → tu perfil)
                         <div
                           onClick={() => onProfileClick(users.find(u => u.id === notif.raterId) || user!)}
                           className="cursor-pointer hover:scale-105 transition-transform"
                         >
                           <BadgeIcon type={BadgeType.CHARISMA} className="w-10 h-10 text-theme-accent drop-shadow-sm" />
                         </div>
                       ) : (
                         // RATING: Post + Score (click → ver post)
                         <div
                           onClick={() => {
                             if (notif.postId && onPostClick) {
                               const post = posts.find(p => p.id === notif.postId);
                               if (post) onPostClick(post);
                             }
                           }}
                           className="relative cursor-pointer hover:scale-105 transition-transform"
                         >
                           {/* Post thumbnail */}
                           {notif.postMediaUrl ? (
                             <div className="w-12 h-12 rounded-lg overflow-hidden border border-theme-divider">
                               <img src={notif.postMediaUrl} alt="Post" className="w-full h-full object-cover" />
                             </div>
                           ) : (
                             <div className="w-12 h-12 rounded-lg bg-theme-card border border-theme-divider flex items-center justify-center">
                               <span className="text-lg">📷</span>
                             </div>
                           )}
                           {/* Score badge en esquina */}
                           <div className="absolute -bottom-1 -left-1 bg-brand-gradient text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold border-2 border-theme-bg">
                             {notif.score.toFixed(1)}
                           </div>
                         </div>
                       )}
                  </div>
                );
             })}
           </div>
        )}
```

## CAMBIOS CLAVE:

1. **Avatar ahora es clickable** → Lleva a perfil del rater
2. **Post ratings**: Thumbnail del post derecha con nota en esquina → Click ve post
3. **Described**: Icono de radar derecha → Click va a perfil del rater
4. **Texto medio**: Click muestra modal de badges (para DESCRIBED)

## DESPUÉS DE HACER EL CAMBIO:

Guarda el archivo y verás las notificaciones mucho más interactivas!
