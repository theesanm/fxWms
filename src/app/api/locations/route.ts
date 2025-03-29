import { NextResponse } from 'next/server';
import postgrest from '@/lib/postgrest';

export async function GET() {
  try {
    const response = await postgrest.get('/locations');
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Locations GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const locationData = await request.json();
    const response = await postgrest.post('/locations', locationData);
    return NextResponse.json(response.data[0], { status: 201 });
  } catch (error: any) {
    console.error('Locations POST Error:', error);
    
    // Handle duplicate key violations
    if (error.status === 409 || 
        error.data?.code === '23505' || 
        error.message?.includes('duplicate key value')) {
      return NextResponse.json(
        { 
          error: 'Duplicate location code', 
          message: 'A location with this code already exists'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create location',
        message: error.message || 'An unexpected error occurred'
      },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    
    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    const locationData = await request.json();
    const response = await postgrest.patch(
      `/locations?location_id=eq.${locationId}`,
      locationData
    );
    return NextResponse.json(response.data[0]);
  } catch (error) {
    console.error('Locations PATCH Error:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    
    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    await postgrest.delete(`/locations?location_id=eq.${locationId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Locations DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}

