import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/bcrypt.server';
import postgrest from '@/lib/postgrest';

export async function POST(request: Request) {
    try {
        const userData = await request.json();
        
        // Hash password server-side
        const hashedPassword = await hashPassword(userData.password_hash);
        
        const newUserData = {
            ...userData,
            password_hash: hashedPassword
        };
        
        const response = await postgrest.post('/users', newUserData);
        
        // Remove sensitive data before sending response
        const { password_hash, ...safeUserData } = response.data;
        return NextResponse.json(safeUserData);
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
