import { NextResponse } from 'next/server';
import postgrest from '@/lib/postgrest';

export async function GET() {
  try {
    const response = await postgrest.get('/zones');
    
    if (!response?.data) {
      throw new Error('No data received from PostgREST');
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Zones GET Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch zones from database' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const zoneData = await request.json();
    const response = await postgrest.post('/zones', zoneData);
    
    if (!response?.data) {
      throw new Error('No data received from PostgREST after POST');
    }

    return NextResponse.json(response.data[0], { status: 201 });
  } catch (error) {
    console.error('Zones POST Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    });
    
    return NextResponse.json(
      { error: 'Failed to create zone in database' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zone_id');
    
    if (!zoneId) {
      return NextResponse.json(
        { error: 'Zone ID is required' },
        { status: 400 }
      );
    }

    const zoneData = await request.json();
    const response = await postgrest.patch(`/zones?zone_id=eq.${zoneId}`, zoneData);
    
    if (!response?.data) {
      throw new Error('No data received from PostgREST after PATCH');
    }

    return NextResponse.json(response.data[0]);
  } catch (error) {
    console.error('Zones PATCH Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    });
    
    return NextResponse.json(
      { error: 'Failed to update zone in database' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zone_id');
    
    if (!zoneId) {
      return NextResponse.json(
        { error: 'Zone ID is required' },
        { status: 400 }
      );
    }

    await postgrest.delete(`/zones?zone_id=eq.${zoneId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Zones DELETE Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    });
    
    return NextResponse.json(
      { error: 'Failed to delete zone from database' },
      { status: 500 }
    );
  }
}
















