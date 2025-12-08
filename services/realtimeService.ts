import { supabase } from './supabaseClient';
import { Notification, BadgeType } from '../types';

/**
 * Subscribe to real-time notifications for a user
 * Shows toast popup when new notification arrives
 */
export const subscribeToNotifications = (
    userId: string,
    onNewNotification: (notification: Notification) => void
): (() => void) => {
    console.log('[REALTIME] Subscribing to notifications for user:', userId);

    const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                console.log('[REALTIME] New notification received:', payload);

                // Map database notification to app Notification type
                const dbNotif = payload.new;
                const notification: Notification = {
                    id: dbNotif.id,
                    type: dbNotif.type,
                    raterId: dbNotif.rater_id,
                    raterName: dbNotif.rater_name,
                    score: dbNotif.score,
                    emoji: dbNotif.emoji,
                    timestamp: new Date(dbNotif.created_at).getTime(),
                    postId: dbNotif.post_id,
                    postMediaUrl: dbNotif.post_media_url,
                    badgeScores: dbNotif.badge_scores,
                };

                onNewNotification(notification);
            }
        )
        .subscribe((status) => {
            console.log('[REALTIME] Subscription status:', status);
        });

    // Return unsubscribe function
    return () => {
        console.log('[REALTIME] Unsubscribing from notifications');
        supabase.removeChannel(channel);
    };
};

/**
 * Subscribe to profile updates (for badge averages)
 */
export const subscribeToProfileUpdates = (
    userId: string,
    onProfileUpdate: (profile: any) => void
): (() => void) => {
    console.log('[REALTIME] Subscribing to profile updates for user:', userId);

    const channel = supabase
        .channel(`profile:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${userId}`,
            },
            (payload) => {
                console.log('[REALTIME] Profile updated:', payload);
                onProfileUpdate(payload.new);
            }
        )
        .subscribe((status) => {
            console.log('[REALTIME] Profile subscription status:', status);
        });

    return () => {
        console.log('[REALTIME] Unsubscribing from profile updates');
        supabase.removeChannel(channel);
    };
};
