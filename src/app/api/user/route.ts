import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/bcrypt.server';
import postgrest from '@/lib/postgrest';

export async function POST(request: Request) {
  try {
    const { password_hash, ...userData } = await request.json();
    
    console.log('Received password_hash:', password_hash); // Debug log
    
    // Hash the password using bcrypt
    const hashedPassword = await hashPassword(password_hash);
    
    console.log('Generated hash:', hashedPassword); // Debug log
    
    // Create user with hashed password
    const newUserData = {
      ...userData,
      password_hash: hashedPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Sending to PostgREST:', {
      ...newUserData,
      password_hash: '[REDACTED]'
    }); // Debug log
    
    // Forward to PostgREST
    const response = await postgrest.post('/users', newUserData);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error creating user:', error);
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    }); // Enhanced error logging
    return NextResponse.json(
      { error: error.response?.data?.message || 'Failed to create user' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const { password_hash, ...userData } = await request.json();
    
    let updateData = {
      ...userData,
      updated_at: new Date().toISOString()
    };

    // Only hash and update password if it's provided
    if (password_hash) {
      const hashedPassword = await hashPassword(password_hash);
      updateData = {
        ...updateData,
        password_hash: hashedPassword
      };
    }

    // Forward to PostgREST
    await postgrest.patch(`/users?user_id=eq.${user_id}`, updateData);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.response?.data?.message || 'Failed to update user' },
      { status: error.response?.status || 500 }
    );
  }
}







