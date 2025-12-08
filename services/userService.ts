import { supabase } from './supabaseClient';
import { User, BadgeType } from '../types';

/**
 * Get user profile by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return mapDbUserToUser(data);
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
};

/**
 * Get multiple users by IDs
 */
export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

        if (error) throw error;
        return data.map(mapDbUserToUser);
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

/**
 * Search users by username or display name
 */
export const searchUsers = async (query: string): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
            .limit(20);

        if (error) throw error;
        return data.map(mapDbUserToUser);
    } catch (error) {
        console.error('Error searching users:', error);
        return [];
    }
};

/**
 * Get all users (for global search and user discovery)
 * Limit to 100 most recent users to avoid performance issues
 */
export const getAllUsers = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        console.log('[USER_SERVICE] Loaded', data.length, 'users from Supabase');
        return data.map(mapDbUserToUser);
    } catch (error) {
        console.error('Error fetching all users:', error);
        return [];
    }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                display_name: updates.displayName,
                bio: updates.bio,
                age: updates.age,
                nation: updates.nation,
                avatar_url: updates.avatarUrl,
            })
            .eq('id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        return false;
    }
};

/**
 * Follow/Unfollow a user
 */
export const toggleFollow = async (followerId: string, followingId: string, isFollowing: boolean): Promise<boolean> => {
    try {
        if (isFollowing) {
            // Unfollow
            const { error } = await supabase
                .from('follows')
                .delete()
                .eq('follower_id', followerId)
                .eq('following_id', followingId);

            if (error) throw error;

            // Update counts
            await Promise.all([
                supabase.rpc('decrement_followers_count', { user_id: followingId }),
                supabase.rpc('decrement_following_count', { user_id: followerId })
            ]);
        } else {
            // Follow
            const { error } = await supabase
                .from('follows')
                .insert({
                    follower_id: followerId,
                    following_id: followingId,
                });

            if (error) throw error;

            // Update counts
            await Promise.all([
                supabase.rpc('increment_followers_count', { user_id: followingId }),
                supabase.rpc('increment_following_count', { user_id: followerId })
            ]);
        }

        return true;
    } catch (error) {
        console.error('Error toggling follow:', error);
        return false;
    }
};

/**
 * Check if user A follows user B
 */
export const checkIsFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return !!data;
    } catch (error) {
        console.error('Error checking follow status:', error);
        return false;
    }
};

/**
 * Get followers of a user
 */
export const getFollowers = async (userId: string): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('follows')
            .select('follower_id, profiles!follows_follower_id_fkey(*)')
            .eq('following_id', userId);

        if (error) throw error;
        return data.map(item => mapDbUserToUser(item.profiles));
    } catch (error) {
        console.error('Error fetching followers:', error);
        return [];
    }
};

/**
 * Get users that a user is following
 */
export const getFollowing = async (userId: string): Promise<User[]> => {
    try {
        const { data, error } = await supabase
            .from('follows')
            .select('following_id, profiles!follows_following_id_fkey(*)')
            .eq('follower_id', userId);

        if (error) throw error;
        return data.map(item => mapDbUserToUser(item.profiles));
    } catch (error) {
        console.error('Error fetching following:', error);
        return [];
    }
};

// Helper function to map database user to app User type
function mapDbUserToUser(dbUser: any): User {
    return {
        id: dbUser.id,
        username: dbUser.username,
        displayName: dbUser.display_name,
        avatarUrl: dbUser.avatar_url || '',
        bio: dbUser.bio || '',
        age: dbUser.age,
        nation: dbUser.nation,
        coins: dbUser.coins || 0,
        averageScore: parseFloat(dbUser.average_score) || 0,
        totalRatings: dbUser.total_ratings || 0,
        followersCount: dbUser.followers_count || 0,
        followingCount: dbUser.following_count || 0,
        postsCount: dbUser.posts_count || 0,
        badgeAverages: dbUser.badge_averages || {
            [BadgeType.INTELLIGENCE]: 0,
            [BadgeType.CHARISMA]: 0,
            [BadgeType.AFFECTIONATE]: 0,
            [BadgeType.HUMOR]: 0,
            [BadgeType.ACTIVE]: 0,
            [BadgeType.EXTROVERTED]: 0,
        },
        ratingHistory: dbUser.rating_history || [],
        isVerified: dbUser.is_verified || false,
        isPrivate: dbUser.is_private || false,
        streakDays: dbUser.streak_days || 0,
    };
}
