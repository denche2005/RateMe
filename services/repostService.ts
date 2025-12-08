import { supabase } from './supabaseClient';

/**
 * Toggle repost status for a post
 * Returns true if reposted, false if unreposted
 */
export const toggleRepost = async (postId: string, userId: string): Promise<boolean> => {
    try {
        // Check if already reposted
        const { data: existing } = await supabase
            .from('reposts')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            // Unrepost
            const { error } = await supabase
                .from('reposts')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId);

            if (error) throw error;
            console.log('[REPOST] Post unreposted');
            return false;
        } else {
            // Repost
            const { error } = await supabase
                .from('reposts')
                .insert({
                    post_id: postId,
                    user_id: userId
                });

            if (error) throw error;
            console.log('[REPOST] Post reposted');
            return true;
        }
    } catch (error) {
        console.error('Error toggling repost:', error);
        return false;
    }
};

/**
 * Check if a post is reposted by user
 */
export const isPostReposted = async (postId: string, userId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('reposts')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return !!data;
    } catch (error) {
        console.error('Error checking repost status:', error);
        return false;
    }
};


