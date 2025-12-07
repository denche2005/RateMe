import { supabase } from './supabaseClient';

/**
 * Recalculate and update post's average rating
 */
export const recalculatePostRating = async (postId: string): Promise<boolean> => {
    try {
        // Get all ratings for this post
        const { data: ratings, error: ratingsError } = await supabase
            .from('ratings')
            .select('value')
            .eq('target_id', postId)
            .eq('target_type', 'post');

        if (ratingsError) throw ratingsError;

        const average = ratings && ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
            : 0;

        // Update post
        const { error: updateError } = await supabase
            .from('posts')
            .update({
                average_rating: average,
                rating_count: ratings?.length || 0
            })
            .eq('id', postId);

        if (updateError) throw updateError;

        return true;
    } catch (error) {
        console.error('Error recalculating post rating:', error);
        return false;
    }
};

/**
 * Recalculate and update user's average score from their posts
 */
export const recalculateUserScore = async (userId: string): Promise<boolean> => {
    try {
        // Get all posts by this user
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select('average_rating')
            .eq('creator_id', userId);

        if (postsError) throw postsError;

        const average = posts && posts.length > 0
            ? posts.reduce((sum, p) => sum + p.average_rating, 0) / posts.length
            : 0;

        // Update profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                average_score: average,
                posts_count: posts?.length || 0
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        return true;
    } catch (error) {
        console.error('Error recalculating user score:', error);
        return false;
    }
};
