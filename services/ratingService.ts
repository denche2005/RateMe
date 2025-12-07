import { supabase } from './supabaseClient';
import { BadgeType } from '../types';

export interface CreateRatingParams {
    raterId: string;
    targetId: string;
    targetType: 'user' | 'post';
    value: number;
    badges?: Partial<Record<BadgeType, number>>;
}

/**
 * Create a new rating
 * This will automatically trigger recalculation of user stats via database trigger
 */
export const createRating = async (params: CreateRatingParams): Promise<{ success: boolean; error?: string }> => {
    try {
        const { raterId, targetId, targetType, value, badges } = params;

        // Insert rating
        const { data, error } = await supabase
            .from('ratings')
            .insert({
                rater_id: raterId,
                target_id: targetId,
                target_type: targetType,
                value,
                badges: badges || null,
            })
            .select()
            .single();

        if (error) {
            // Check if it's a duplicate rating error
            if (error.code === '23505') {
                return { success: false, error: 'You have already rated this user/post recently' };
            }
            throw error;
        }

        // If rating a post, update post stats
        if (targetType === 'post') {
            await updatePostRatingStats(targetId);
        }

        return { success: true };
    } catch (error) {
        console.error('Error creating rating:', error);
        return { success: false, error: 'Failed to create rating' };
    }
};

/**
 * Update post rating statistics
 */
async function updatePostRatingStats(postId: string) {
    try {
        // Calculate average rating and count
        const { data, error } = await supabase
            .from('ratings')
            .select('value')
            .eq('target_id', postId)
            .eq('target_type', 'post');

        if (error) throw error;

        const count = data.length;
        const average = count > 0
            ? data.reduce((sum, r) => sum + r.value, 0) / count
            : 0;

        // Update post
        await supabase
            .from('posts')
            .update({
                average_rating: average,
                rating_count: count,
            })
            .eq('id', postId);
    } catch (error) {
        console.error('Error updating post stats:', error);
    }
}

/**
 * Get ratings for a user
 */
export const getUserRatings = async (userId: string): Promise<any[]> => {
    try {
        const { data, error } = await supabase
            .from('ratings')
            .select('*, rater:profiles!ratings_rater_id_fkey(username, display_name, avatar_url)')
            .eq('target_id', userId)
            .eq('target_type', 'user')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching user ratings:', error);
        return [];
    }
};

/**
 * Check if user can rate another user (cooldown check)
 */
export const canRateUser = async (raterId: string, targetId: string): Promise<{ canRate: boolean; lastRatedAt?: Date }> => {
    try {
        const { data, error } = await supabase
            .from('ratings')
            .select('created_at')
            .eq('rater_id', raterId)
            .eq('target_id', targetId)
            .eq('target_type', 'user')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

        if (!data) {
            return { canRate: true };
        }

        const lastRatedAt = new Date(data.created_at);
        const cooldownMinutes = 5;
        const now = new Date();
        const minutesSinceLastRating = (now.getTime() - lastRatedAt.getTime()) / (1000 * 60);

        return {
            canRate: minutesSinceLastRating >= cooldownMinutes,
            lastRatedAt,
        };
    } catch (error) {
        console.error('Error checking rating cooldown:', error);
        return { canRate: true }; // Fail open
    }
};

/**
 * Get rating statistics for a user
 */
export const getUserRatingStats = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('average_score, total_ratings, badge_averages')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching rating stats:', error);
        return null;
    }
};

/**
 * Delete a rating (admin/user own rating)
 */
export const deleteRating = async (ratingId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('ratings')
            .delete()
            .eq('id', ratingId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting rating:', error);
        return false;
    }
};
