import { supabase } from './supabaseClient';
import { Comment } from '../types';

/**
 * Create a new comment
 */
export const createComment = async (postId: string, userId: string, text: string): Promise<Comment | null> => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                user_id: userId,
                text: text
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            postId: data.post_id,
            userId: data.user_id,
            text: data.text,
            likes: data.likes_count || 0,
            createdAt: data.created_at
        };
    } catch (error) {
        console.error('Error creating comment:', error);
        return null;
    }
};

/**
 * Get comments for a post
 */
export const getPostComments = async (postId: string): Promise<Comment[]> => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map(c => ({
            id: c.id,
            postId: c.post_id,
            userId: c.user_id,
            text: c.text,
            likes: c.likes_count || 0,
            createdAt: c.created_at
        }));
    } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting comment:', error);
        return false;
    }
};

/**
 * Toggle like on a comment
 */
export const toggleCommentLike = async (commentId: string, userId: string): Promise<boolean> => {
    try {
        // Check if already liked
        const { data: existing } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', commentId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            // Unlike
            const { error } = await supabase
                .from('comment_likes')
                .delete()
                .eq('comment_id', commentId)
                .eq('user_id', userId);

            if (error) throw error;
            return false;
        } else {
            // Like
            const { error } = await supabase
                .from('comment_likes')
                .insert({
                    comment_id: commentId,
                    user_id: userId
                });

            if (error) throw error;
            return true;
        }
    } catch (error) {
        console.error('Error toggling comment like:', error);
        return false;
    }
};

/**
 * Get IDs of comments liked by user
 */
export const getUserLikedComments = async (userId: string, postCommentIds: string[]): Promise<string[]> => {
    try {
        if (postCommentIds.length === 0) return [];

        const { data, error } = await supabase
            .from('comment_likes')
            .select('comment_id')
            .eq('user_id', userId)
            .in('comment_id', postCommentIds);

        if (error) throw error;
        return data.map(l => l.comment_id);
    } catch (error) {
        console.error('Error fetching liked comments:', error);
        return [];
    }
};
