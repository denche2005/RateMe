import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { onAuthStateChange, getSession } from './authService';

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        getSession().then((session) => {
            setUser(session?.user || null);
            setLoading(false);
        });

        // Listen for auth changes
        const subscription = onAuthStateChange((user) => {
            setUser(user);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
