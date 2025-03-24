import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api-client'; // Use apiClient for internal API routes
import api from '@/lib/api'; // Use api for PostgREST calls

interface User {
    user_id: number;
    username: string;
    email: string;
    role_id: number;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: false,
            error: null,
            setUser: (user) => set({ user }),
            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.post('/api/auth/login', {
                        email,
                        password
                    });
                    
                    if (response.data.user) {
                        set({ user: response.data.user, isLoading: false });
                    } else {
                        set({ error: 'Invalid credentials', isLoading: false });
                    }
                } catch (err) {
                    console.error('Login error:', err);
                    set({ 
                        error: 'Invalid email or password', 
                        isLoading: false 
                    });
                    throw err;
                }
            },
            logout: () => {
                localStorage.removeItem('token');
                set({ user: null });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
