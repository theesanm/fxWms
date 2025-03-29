import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    lastActivity: number | null;
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateActivity: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            error: null,
            lastActivity: null,
            setUser: (user) => set({ user }),
            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await fetch('/api/auth/login', {  // Use relative path
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email,
                            password
                        })
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Authentication failed');
                    }

                    const data = await response.json();
                    set({ 
                        user: data.user, 
                        isLoading: false, 
                        error: null,
                        lastActivity: Date.now()
                    });
                } catch (err: any) {
                    const errorMessage = err.response?.data?.error || 'Authentication failed';
                    set({ 
                        error: errorMessage, 
                        isLoading: false,
                        user: null,
                        lastActivity: null
                    });
                    throw err;
                }
            },
            logout: () => set({ user: null, error: null, lastActivity: null }),
            updateActivity: () => set({ lastActivity: Date.now() })
        }),
        {
            name: 'auth-storage'
        }
    )
);
