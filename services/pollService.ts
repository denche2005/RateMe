import { supabase } from './supabaseClient';

export interface DailyPoll {
    id: number;
    question: string;
    option_a: string;
    option_b: string;
    emoji_a: string;
    emoji_b: string;
}

export interface PollResponse {
    id: string;
    user_id: string;
    poll_id: number;
    response_type: 'VOTE_A' | 'VOTE_B' | 'NOTE';
    vote_choice?: 'A' | 'B';
    note_text?: string;
    created_at: string;
    updated_at: string;
    // Joined data
    user_name?: string;
    user_avatar?: string;
}

/**
 * Get today's poll
 */
export const getTodaysPoll = async (): Promise<DailyPoll | null> => {
    try {
        // Get today's poll ID using the function
        const { data: pollIdData, error: pollIdError } = await supabase
            .rpc('get_todays_poll');

        if (pollIdError) {
            console.error('[POLLS] Error getting today\'s poll ID:', pollIdError);
            return null;
        }

        // Get the poll details
        const { data: poll, error: pollError } = await supabase
            .from('daily_polls')
            .select('*')
            .eq('id', pollIdData)
            .single();

        if (pollError) {
            console.error('[POLLS] Error fetching poll:', pollError);
            return null;
        }

        return poll;
    } catch (error) {
        console.error('[POLLS] Exception getting today\'s poll:', error);
        return null;
    }
};

/**
 * Get friend responses for today's poll
 */
export const getFriendResponses = async (
    pollId: number,
    currentUserId: string
): Promise<PollResponse[]> => {
    try {
        const { data: responses, error } = await supabase
            .from('poll_responses')
            .select(`
                *,
                user:profiles!poll_responses_user_id_fkey(
                    id,
                    username,
                    display_name,
                    avatar_url
                )
            `)
            .eq('poll_id', pollId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[POLLS] Error fetching responses:', error);
            return [];
        }

        if (!responses) return [];

        // Map to include user data
        return responses.map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            poll_id: r.poll_id,
            response_type: r.response_type,
            vote_choice: r.vote_choice,
            note_text: r.note_text,
            created_at: r.created_at,
            updated_at: r.updated_at,
            user_name: r.user?.display_name || r.user?.username,
            user_avatar: r.user?.avatar_url
        }));
    } catch (error) {
        console.error('[POLLS] Exception fetching responses:', error);
        return [];
    }
};

/**
 * Get current user's response for a poll
 */
export const getMyResponse = async (
    pollId: number,
    userId: string
): Promise<PollResponse | null> => {
    try {
        const { data: response, error } = await supabase
            .from('poll_responses')
            .select('*')
            .eq('poll_id', pollId)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No response yet
                return null;
            }
            console.error('[POLLS] Error fetching my response:', error);
            return null;
        }

        return response;
    } catch (error) {
        console.error('[POLLS] Exception fetching my response:', error);
        return null;
    }
};

/**
 * Submit or update poll response
 */
export const submitPollResponse = async (
    pollId: number,
    userId: string,
    responseType: 'VOTE_A' | 'VOTE_B' | 'NOTE',
    voteChoice?: 'A' | 'B',
    noteText?: string
): Promise<{ success: boolean; response?: PollResponse; error?: string }> => {
    try {
        // Validate note length
        if (responseType === 'NOTE' && noteText && noteText.length > 150) {
            return { success: false, error: 'Note too long (max 150 characters)' };
        }

        const responseData: any = {
            poll_id: pollId,
            user_id: userId,
            response_type: responseType,
            vote_choice: voteChoice || null,
            note_text: noteText || null
        };

        // Upsert (insert or update)
        const { data: response, error } = await supabase
            .from('poll_responses')
            .upsert(responseData, {
                onConflict: 'user_id,poll_id'
            })
            .select()
            .single();

        if (error) {
            console.error('[POLLS] Error submitting response:', error);
            return { success: false, error: error.message };
        }

        return { success: true, response };
    } catch (error: any) {
        console.error('[POLLS] Exception submitting response:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete poll response
 */
export const deletePollResponse = async (
    pollId: number,
    userId: string
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('poll_responses')
            .delete()
            .eq('poll_id', pollId)
            .eq('user_id', userId);

        if (error) {
            console.error('[POLLS] Error deleting response:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[POLLS] Exception deleting response:', error);
        return false;
    }
};
