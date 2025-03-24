import { NextResponse } from 'next/server';
import api from '@/lib/api';

export async function GET() {
  try {
    const response = await api.get('zones');
    const zones = response.data;
    return NextResponse.json(zones);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const zone = await request.json();
    const response = await api.post('zones', {
      body: JSON.stringify(zone),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const newZone = response.data;
    return NextResponse.json(newZone, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create zone' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const zone = await request.json();
    const response = await api.patch(`zones?zone_id=eq.${zone.zone_id}`, {
      body: JSON.stringify(zone),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return NextResponse.json(zone);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update zone' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await api.delete(`zones?zone_id=eq.${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete zone' },
      { status: 500 }
    );
  }
}




