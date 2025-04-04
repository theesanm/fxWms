import { NextResponse } from 'next/server';
import postgrest from '@/lib/postgrest';

export async function GET() {
    try {
        const response = await postgrest.get('/inventory_transactions');
        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Inventory Transactions GET Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch inventory transactions' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const response = await postgrest.post('/inventory_transactions', data);
        return NextResponse.json(response.data[0], { status: 201 });
    } catch (error: any) {
        console.error('Inventory Transactions POST Error:', error);
        return NextResponse.json(
            { error: 'Failed to create inventory transaction' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('transaction_id');
        
        if (!id) {
            return NextResponse.json(
                { error: 'Transaction ID is required' },
                { status: 400 }
            );
        }

        const data = await request.json();
        const response = await postgrest.patch(`/inventory_transactions?transaction_id=eq.${id}`, data);
        return NextResponse.json(response.data[0]);
    } catch (error) {
        console.error('Inventory Transactions PATCH Error:', error);
        return NextResponse.json(
            { error: 'Failed to update inventory transaction' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('transaction_id');
        
        if (!id) {
            return NextResponse.json(
                { error: 'Transaction ID is required' },
                { status: 400 }
            );
        }

        await postgrest.delete(`/inventory_transactions?transaction_id=eq.${id}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Inventory Transactions DELETE Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete inventory transaction' },
            { status: 500 }
        );
    }
}