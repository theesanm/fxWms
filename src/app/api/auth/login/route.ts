import { NextResponse } from 'next/server';
import { compare } from '@/lib/crypto';
import postgrest from '@/lib/postgrest';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Query PostgREST internally
        try {
            const response = await postgrest.get(`/users?email=eq.${encodeURIComponent(email)}`);
            
            if (!response.data || response.data.length === 0) {
                return NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                );
            }

            const user = response.data[0];
            const isPasswordValid = await compare(password, user.password_hash);
            
            if (isPasswordValid) {
                const { password_hash, ...safeUser } = user;
                return NextResponse.json({ user: safeUser });
            }

            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );

        } catch (postgrestError: any) {
            console.error('PostgREST Error:', {
                message: postgrestError.message,
                response: postgrestError.response?.data,
                status: postgrestError.response?.status
            });
            
            return NextResponse.json(
                { error: 'Database connection failed' },
                { status: 503 }
            );
        }
    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}









