import { supabase } from './supabaseClient';

/**
 * Toggle save status for a post
 * Returns true if saved, false if unsaved
 */
export const toggleSave = async (postId: string, userId: string): Promise<boolean> => {
    try {
        // Check if already saved
        const { data: existing } = await supabase
            .from('saved_posts')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            // Unsave
            const { error } = await supabase
                .from('saved_posts')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId);

            if (error) throw error;
            console.log('[SAVED] Post unsaved');
            return false;
        } else {
            // Save
            const { error } = await supabase
                .from('saved_posts')
                .insert({
                    post_id: postId,
                    user_id: userId
                });

            if (error) throw error;
            console.log('[SAVED] Post saved');
            return true;
        }
    } catch (error) {
        console.error('Error toggling save:', error);
        return false;
    }
};

/**
 * Check if a post is saved by user
 */
export const isPostSaved = async (postId: string, userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('saved_posts')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return !!data;
    } catch (error) {
        console.error('Error checking save status:', error);
        return false;
    }
};

/**
 * Get all saved posts for a user
 */
export const getUserSavedPosts = async (userId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
            .from('saved_posts')
            .select('post_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data?.map(item => item.post_id) || [];
    } catch (error) {
        console.error('Error fetching saved posts:', error);
        return [];
    }
};
