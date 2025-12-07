import React, { useState } from 'react';
import { signIn, signUp } from '../services/authService';

interface AuthScreenProps {
    onAuthComplete: () => void;
}

export function AuthScreen({ onAuthComplete }: AuthScreenProps) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                const { error } = await signIn(email, password);
                if (error) throw error;
                onAuthComplete();
            } else {
                // Register
                if (!username || !displayName) {
                    setError('Username and display name are required');
                    return;
                }
                const { error } = await signUp(email, password, { username, displayName });
                if (error) throw error;
                onAuthComplete();
            }
        } catch (err: any) {
            setError(err?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-theme-bg">
            <div className="w-full max-w-md p-8 mx-4">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-block">
                        <div className="text-6xl mb-2 animate-star-reveal">⭐</div>
                        <h1 className="text-4xl font-bold bg-brand-gradient bg-clip-text text-transparent">
                            RateMe
                        </h1>
                        <p className="text-theme-secondary mt-2">Join the rating revolution</p>
                    </div>
                </div>

                {/* Auth Form */}
                <div className="bg-theme-card rounded-2xl p-6 shadow-soft-xl border border-theme-divider">
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${mode === 'login'
                                    ? 'bg-brand-gradient text-white'
                                    : 'text-theme-secondary hover:text-theme-text'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${mode === 'register'
                                    ? 'bg-brand-gradient text-white'
                                    : 'text-theme-secondary hover:text-theme-text'
                                }`}
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-theme-bg border border-theme-divider text-theme-text placeholder-theme-secondary focus:outline-none focus:border-accent"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Display Name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg bg-theme-bg border border-theme-divider text-theme-text placeholder-theme-secondary focus:outline-none focus:border-accent"
                                    required
                                />
                            </>
                        )}
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-theme-bg border border-theme-divider text-theme-text placeholder-theme-secondary focus:outline-none focus:border-accent"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-theme-bg border border-theme-divider text-theme-text placeholder-theme-secondary focus:outline-none focus:border-accent"
                            required
                            minLength={6}
                        />

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-brand-gradient hover:bg-brand-gradient-hover font-semibold text-white transition-all disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    {mode === 'register' && (
                        <p className="text-xs text-theme-secondary mt-4 text-center">
                            By registering, you agree to rate responsibly 😊
                        </p>
                    )}
                </div>

                {/* Demo hint */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-theme-secondary">
                        Testing? Use any email + password (6+ chars)
                    </p>
                </div>
            </div>
        </div>
    );
}
