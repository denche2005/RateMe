import { supabase } from './supabaseClient';
import { Post } from '../types';

/**
 * Create a new post
 */
export const createPost = async (params: {
    creatorId: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption: string;
}): Promise<{ success: boolean; post?: Post; error?: string }> => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .insert({
                creator_id: params.creatorId,
                media_url: params.mediaUrl,
                media_type: params.mediaType,
                caption: params.caption,
            })
            .select()
            .single();

        if (error) throw error;

        // Increment user's posts count
        await supabase.rpc('increment_posts_count', { user_id: params.creatorId });

        return { success: true, post: mapDbPostToPost(data) };
    } catch (error) {
        console.error('Error creating post:', error);
        return { success: false, error: 'Failed to create post' };
    }
};

/**
 * Get posts for feed (all users or specific users)
 */
export const getFeedPosts = async (limit: number = 20): Promise<Post[]> => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return (data || []).map(mapDbPostToPost);
    } catch (error) {
        console.error('Error fetching feed posts:', error);
        return [];
    }
};

/**
 * Get posts by a specific user
 */
export const getUserPosts = async (userId: string): Promise<Post[]> => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('creator_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapDbPostToPost);
    } catch (error) {
        console.error('Error fetching user posts:', error);
        return [];
    }
};

/**
 * Get posts reposted by a specific user
 */
export const getUserReposts = async (userId: string): Promise<Post[]> => {
    console.log('[DEBUG] getUserReposts v2 called for user:', userId);
    try {
        // 1. Get reposted post IDs
        const { data: reposts, error: repostError } = await supabase
            .from('reposts')
            .select('post_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (repostError) throw repostError;

        // Deduplicate IDs to avoid "unique key" errors in React
        const postIds = Array.from(new Set(reposts.map(r => r.post_id)));

        if (postIds.length === 0) return [];

        // 2. Fetch the actual posts
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select('*')
            .in('id', postIds);

        if (postsError) throw postsError;

        // 3. Map to Post objects and preserve order
        const postsMap = new Map(posts.map(p => [p.id, p]));
        return postIds
            .map(id => postsMap.get(id))
            .filter(p => p !== undefined)
            .map(mapDbPostToPost);
    } catch (error) {
        console.error('Error fetching user reposts:', error);
        return [];
    }
};

/**
 * Get a single post by ID
 */
export const getPostById = async (postId: string): Promise<Post | null> => {
    try {
        // 1. Get Post Data
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();

        if (postError) throw postError;

        return mapDbPostToPost(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        return null;
    }
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string, creatorId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('creator_id', creatorId);

        if (error) throw error;

        // Decrement user's posts count
        await supabase.rpc('decrement_posts_count', { user_id: creatorId });

        return true;
    } catch (error) {
        console.error('Error deleting post:', error);
        return false;
    }
};

/**
 * Upload image to Supabase Storage
 */
export const uploadImage = async (file: File, userId: string): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('posts')
            .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('Error uploading image:', error);
        return { success: false, error: 'Failed to upload image' };
    }
};

// Helper to map database post to app Post type
function mapDbPostToPost(dbPost: any): Post {
    return {
        id: dbPost.id,
        creatorId: dbPost.creator_id,
        mediaUrl: dbPost.media_url,
        type: dbPost.media_type,
        caption: dbPost.caption || '',
        averageRating: parseFloat(dbPost.average_rating) || 0,
        ratingCount: dbPost.rating_count || 0,
        saveCount: dbPost.saves_count || 0,
        repostCount: dbPost.reposts_count || 0,
        commentsCount: dbPost.comments_count || 0,
    };
}
