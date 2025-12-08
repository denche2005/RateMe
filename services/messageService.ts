import { supabase } from './supabaseClient';

export interface Conversation {
    id: string;
    user1_id: string;
    user2_id: string;
    last_message_at: string;
    created_at: string;
    // Computed fields
    other_user_id?: string;
    other_user_name?: string;
    other_user_avatar?: string;
    last_message_text?: string;
    unread_count?: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    text: string;
    is_read: boolean;
    created_at: string;
    reply_to_id?: string | null;
}

/**
 * Get or create a conversation between two users
 */
export const getOrCreateConversation = async (
    userId1: string,
    userId2: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> => {
    try {
        const { data, error } = await supabase
            .rpc('get_or_create_conversation', {
                p_user1_id: userId1,
                p_user2_id: userId2
            });

        if (error) {
            console.error('[MESSAGES] Error getting/creating conversation:', error);
            return { success: false, error: error.message };
        }

        return { success: true, conversationId: data };
    } catch (error: any) {
        console.error('[MESSAGES] Exception:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (
    userId: string
): Promise<Conversation[]> => {
    try {
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select(`
                *,
                user1:users!conversations_user1_id_fkey(id, username, display_name, avatar_url),
                user2:users!conversations_user2_id_fkey(id, username, display_name, avatar_url)
            `)
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
            .order('last_message_at', { ascending: false });

        if (error) {
            console.error('[MESSAGES] Error fetching conversations:', error);
            return [];
        }

        if (!conversations) return [];

        // Get last message for each conversation
        const conversationsWithMessages = await Promise.all(
            conversations.map(async (conv: any) => {
                // Determine the other user
                const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;

                // Get last message
                const { data: lastMessage } = await supabase
                    .from('messages')
                    .select('text, sender_id')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                // Get unread count
                const { count: unreadCount } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id)
                    .eq('is_read', false)
                    .neq('sender_id', userId);

                return {
                    id: conv.id,
                    user1_id: conv.user1_id,
                    user2_id: conv.user2_id,
                    last_message_at: conv.last_message_at,
                    created_at: conv.created_at,
                    other_user_id: otherUser.id,
                    other_user_name: otherUser.display_name,
                    other_user_avatar: otherUser.avatar_url,
                    last_message_text: lastMessage?.text || '',
                    unread_count: unreadCount || 0
                };
            })
        );

        return conversationsWithMessages;
    } catch (error) {
        console.error('[MESSAGES] Exception fetching conversations:', error);
        return [];
    }
};

/**
 * Get messages for a conversation
 */
export const getConversationMessages = async (
    conversationId: string
): Promise<Message[]> => {
    try {
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[MESSAGES] Error fetching messages:', error);
            return [];
        }

        return messages || [];
    } catch (error) {
        console.error('[MESSAGES] Exception fetching messages:', error);
        return [];
    }
};

/**
 * Send a message
 */
export const sendMessage = async (
    conversationId: string,
    senderId: string,
    text: string,
    replyToId?: string
): Promise<{ success: boolean; message?: Message; error?: string }> => {
    try {
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                text: text,
                reply_to_id: replyToId || null
            })
            .select()
            .single();

        if (error) {
            console.error('[MESSAGES] Error sending message:', error);
            return { success: false, error: error.message };
        }

        return { success: true, message };
    } catch (error: any) {
        console.error('[MESSAGES] Exception sending message:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
    conversationId: string,
    userId: string
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .eq('is_read', false)
            .neq('sender_id', userId);

        if (error) {
            console.error('[MESSAGES] Error marking messages as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[MESSAGES] Exception marking messages as read:', error);
        return false;
    }
};

/**
 * Search users by username or display name
 */
export const searchUsers = async (
    query: string,
    currentUserId: string
): Promise<Array<{ id: string; username: string; display_name: string; avatar_url: string }>> => {
    try {
        if (!query.trim()) return [];

        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, display_name, avatar_url')
            .neq('id', currentUserId)
            .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
            .limit(10);

        if (error) {
            console.error('[MESSAGES] Error searching users:', error);
            return [];
        }

        return users || [];
    } catch (error) {
        console.error('[MESSAGES] Exception searching users:', error);
        return [];
    }
};
