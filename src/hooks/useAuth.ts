import { create } from 'zustand';

interface User {
    email: string;
    id: string;
    // Add other user properties as needed
}

interface AuthStore {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    logout: () => set({ user: null }),
}));