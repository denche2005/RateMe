import { supabase } from './supabaseClient';
import type { User as AuthUser } from '@supabase/supabase-js';

export interface AuthResponse {
    user: AuthUser | null;
    error: Error | null;
}

/**
 * Sign up a new user with email and password
 */
export const signUp = async (email: string, password: string, userData: {
    username: string;
    displayName: string;
}): Promise<AuthResponse> => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: userData.username,
                    display_name: userData.displayName,
                }
            }
        });

        if (error) throw error;

        // Create profile in profiles table
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    username: userData.username,
                    display_name: userData.displayName,
                    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
                    bio: 'New to RateMe!',
                });

            if (profileError) {
                console.error('Error creating profile:', profileError);
            }
        }

        return { user: data.user, error: null };
    } catch (error) {
        return { user: null, error: error as Error };
    }
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return { user: data.user, error: null };
    } catch (error) {
        return { user: null, error: error as Error };
    }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ error: Error | null }> => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error as Error };
    }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

/**
 * Get current session
 */
export const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user || null);
    });

    return subscription;
};
