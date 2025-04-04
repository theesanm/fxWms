import { NextResponse } from 'next/server';
import postgrest from '@/lib/postgrest';

export async function GET() {
  try {
    const response = await postgrest.get('/inventory');
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Inventory GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const inventoryData = await request.json();
    const response = await postgrest.post('/inventory', inventoryData);
    return NextResponse.json(response.data[0], { status: 201 });
  } catch (error: any) {
    console.error('Inventory POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory record' },
      { status: error.status || 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { inventory_id, ...updateData } = await request.json();
    const response = await postgrest.patch(
      `/inventory?inventory_id=eq.${inventory_id}`,
      updateData
    );
    return NextResponse.json(response.data[0]);
  } catch (error: any) {
    console.error('Inventory PATCH Error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await postgrest.delete(`/inventory?inventory_id=eq.${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Inventory DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory' },
      { status: error.status || 500 }
    );
  }
}