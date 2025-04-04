import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import postgrest from '@/lib/postgrest';

const userUpdateSchema = z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    password_hash: z.string().min(6).optional(),
    role_id: z.number().optional(),
    active: z.boolean().optional(),
    updated_at: z.string().datetime().optional()
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
    const resolvedParams = await params;
    try {
        const response = await postgrest.get(`/users?user_id=eq.${resolvedParams.userId}`);
        return NextResponse.json(response.data[0]);
    } catch (error) {
        console.error('GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
    const resolvedParams = await params;
    try {
        const body = await request.json();
        const validatedData = userUpdateSchema.parse(body);
        const response = await postgrest.patch(
            `/users?user_id=eq.${resolvedParams.userId}`,
            validatedData
        );
        return NextResponse.json(response.data[0]);
    } catch (error) {
        console.error('PATCH Error:', error);
        return NextResponse.json(
            { error: error instanceof z.ZodError ? 'Invalid request data' : 'Failed to update user' },
            { status: error instanceof z.ZodError ? 400 : 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
    const resolvedParams = await params;
    try {
        await postgrest.delete(`/users?user_id=eq.${resolvedParams.userId}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}









