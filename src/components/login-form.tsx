'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/lib/api';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { setUser } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const userData = {
            username: email.split('@')[0],
            email: email,
            password_hash: password,
            role_id: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            const response = await api.post('/users', userData);
            
            if (response.status === 201) {
                const { user_id, username, email, role_id } = response.data;
                const user = { user_id, username, email, role_id };
                setUser(user);
            } else {
                setError('Invalid response from server');
            }
        } catch (err: any) {
            setError('Login failed. Please try again.');
            console.error('Login error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="text-red-500 text-sm">{error}</div>
            )}
            <div>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full p-2 border rounded"
                    required
                />
            </div>
            <div>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full p-2 border rounded"
                    required
                />
            </div>
            <button
                type="submit"
                className="w-full bg-primary text-white p-2 rounded hover:bg-primary-dark"
            >
                Login
            </button>
        </form>
    );
}


