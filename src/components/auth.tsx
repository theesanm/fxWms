'use client';

import { useAuthStore } from "@/stores/auth.store";
import { useEffect, useState } from "react";
import { LoginForm } from "./login-form";
import api from "@/lib/api";

export function Auth({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuthStore();
    const [roleName, setRoleName] = useState<string>('Loading...');

    useEffect(() => {
        const fetchRole = async () => {
            if (user?.role_id) {
                try {
                    const response = await api.get(`/roles?role_id=eq.${user.role_id}`);
                    if (response.data && response.data.length > 0) {
                        setRoleName(response.data[0].role_name);
                    }
                } catch (error) {
                    console.error('Error fetching role:', error);
                    setRoleName('Unknown Role');
                }
            }
        };

        fetchRole();
    }, [user?.role_id]);

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
                    <LoginForm />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600">Welcome, {user.username}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-600">Role: {roleName}</span>
                    </div>
                    <button
                        onClick={logout}
                        className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
                    >
                        Logout
                    </button>
                </div>
            </div>
            {children}
        </>
    );
}


