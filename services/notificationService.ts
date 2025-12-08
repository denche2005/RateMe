import { supabase } from './supabaseClient';
import { Notification, BadgeType } from '../types';

/**
 * Create a notification
 */
export const createNotification = async (notification: Omit<Notification, 'id' | 'timestamp'>): Promise<boolean> => {
    try {
        let targetUserId: string | null = null;

        // CASO 1: Rating/Save/Repost/Comment/Reply de POST - obtener creator del post o targetUserId
        if ((notification.type === 'RATING' || notification.type === 'SAVED' || notification.type === 'REPOSTED' || notification.type === 'COMMENT' || notification.type === 'REPLY') && notification.postId) {
            // Si es REPLY, usar targetUserId explícito (para menciones)
            if (notification.type === 'REPLY' && (notification as any).targetUserId) {
                targetUserId = (notification as any).targetUserId;
            } else {
                // Sino, obtener el creator del post
                const { data: post, error: postError } = await supabase
                    .from('posts')
                    .select('creator_id')
                    .eq('id', notification.postId)
                    .single();

                if (postError || !post) {
                    console.error('Post not found for notification:', notification.postId);
                    return false;
                }

                targetUserId = post.creator_id;
            }
        }

        // CASO 2: Describe Me - usar targetUserId explícito
        else if (notification.type === 'DESCRIBED' && (notification as any).targetUserId) {
            targetUserId = (notification as any).targetUserId;
        }

        if (!targetUserId) {
            console.error('Cannot determine target user for notification');
            return false;
        }

        const notif = {
            user_id: targetUserId,
            type: notification.type,
            rater_id: notification.raterId,
            rater_name: notification.raterName,
            score: notification.score,
            emoji: notification.emoji,
            post_id: notification.postId,
            post_media_url: notification.postMediaUrl,
            badge_scores: notification.badgeScores,
        };

        const { error } = await supabase
            .from('notifications')
            .insert(notif);

        if (error) throw error;

        console.log('[NOTIFICATION] Created successfully for user:', targetUserId);
        return true;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return (data || []).map(mapDbNotificationToNotification);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
};

/**
 * Subscribe to new notifications in real-time
 */
export const subscribeToNotifications = (userId: string, callback: (notification: Notification) => void) => {
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
                const notification = mapDbNotificationToNotification(payload.new);
                callback(notification);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

/**
 * Mark notifications as read
 */
export const markNotificationsAsRead = async (notificationIds: string[]): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', notificationIds);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        return false;
    }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
};

// Helper to map database notification to app Notification type
function mapDbNotificationToNotification(dbNotif: any): Notification {
    return {
        id: dbNotif.id,
        type: dbNotif.type as 'RATING' | 'DESCRIBED' | 'SAVED' | 'REPOSTED' | 'COMMENT' | 'REPLY',
        raterId: dbNotif.rater_id,
        raterName: dbNotif.rater_name,
        score: parseFloat(dbNotif.score) || 0,
        emoji: dbNotif.emoji,
        timestamp: new Date(dbNotif.created_at).getTime(),
        postId: dbNotif.post_id,
        postMediaUrl: dbNotif.post_media_url,
        badgeScores: dbNotif.badge_scores as Record<BadgeType, number> | undefined,
    };
}
