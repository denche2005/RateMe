import { supabase } from './supabaseClient';
import { Comment } from '../types';

/**
 * Create a comment on a post
 */
export const createComment = async (params: {
    postId: string;
    userId: string;
    text: string;
}): Promise<{ success: boolean; comment?: Comment; error?: string }> => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: params.postId,
                user_id: params.userId,
                text: params.text,
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, comment: mapDbCommentToComment(data) };
    } catch (error) {
        console.error('Error creating comment:', error);
        return { success: false, error: 'Failed to create comment' };
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
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapDbCommentToComment);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
};

/**
 * Toggle like on a comment
 */
export const toggleCommentLike = async (commentId: string, userId: string, isLiked: boolean): Promise<boolean> => {
    try {
        // Simple increment/decrement for MVP
        // In production, you'd want a separate 'comment_likes' table
        const { data: comment } = await supabase
            .from('comments')
            .select('likes')
            .eq('id', commentId)
            .single();

        if (!comment) return false;

        const newLikes = isLiked ? comment.likes - 1 : comment.likes + 1;

        const { error } = await supabase
            .from('comments')
            .update({ likes: Math.max(0, newLikes) })
            .eq('id', commentId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error toggling comment like:', error);
        return false;
    }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string, userId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting comment:', error);
        return false;
    }
};

// Helper to map database comment to app Comment type
function mapDbCommentToComment(dbComment: any): Comment {
    return {
        id: dbComment.id,
        postId: dbComment.post_id,
        userId: dbComment.user_id,
        text: dbComment.text,
        timestamp: new Date(dbComment.created_at).getTime(),
        likes: dbComment.likes || 0,
    };
}
