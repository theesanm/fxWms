import { NextResponse } from 'next/server';
import api from '@/lib/api';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Query PostgREST to check credentials
        const response = await api.get(`/users?email=eq.${email}&password_hash=eq.${password}`);
        
        if (response.data && response.data.length > 0) {
            const user = response.data[0];
            return NextResponse.json({
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    role_id: user.role_id,
                }
            });
        }

        return NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
        );
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}


