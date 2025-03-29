import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/bcrypt.server';
import postgrest from '@/lib/postgrest';

export async function PATCH(
    request: NextRequest,
    context: { params: { userId: string } }
): Promise<NextResponse> {
    try {
        const { userId } = context.params;
        const userData = await request.json();
        
        // Prepare update data
        let updateData = {
            ...userData,
            updated_at: new Date().toISOString()
        };

        // Only hash password if it's provided
        if (userData.password_hash) {
            const hashedPassword = await hashPassword(userData.password_hash);
            updateData.password_hash = hashedPassword;
        }

        // Remove password_hash if it's empty
        if (!updateData.password_hash) {
            delete updateData.password_hash;
        }

        // Use userId in the query
        const response = await postgrest.patch(`/users?user_id=eq.${userId}`, updateData, {
            headers: {
                'Prefer': 'return=representation'
            }
        });
        
        if (!response.data || response.data.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Remove sensitive data before sending response
        const { password_hash, ...safeUserData } = response.data[0];
        return NextResponse.json(safeUserData);
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: error.response?.data?.message || 'Failed to update user' },
            { status: error.response?.status || 500 }
        );
    }
}



