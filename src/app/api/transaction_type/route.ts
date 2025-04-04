import { NextResponse } from 'next/server';
import postgrest from '@/lib/postgrest';

export async function GET() {
    try {
        const response = await postgrest.get('/transaction_type');
        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Transaction Type GET Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transaction types' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const response = await postgrest.post('/transaction_type', data);
        return NextResponse.json(response.data[0], { status: 201 });
    } catch (error: any) {
        console.error('Transaction Type POST Error:', error);
        
        if (error.status === 409 || error.message?.includes('duplicate')) {
            return NextResponse.json(
                { error: 'A transaction type with this name already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create transaction type' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('transactiontype_id');
        
        if (!id) {
            return NextResponse.json(
                { error: 'Transaction type ID is required' },
                { status: 400 }
            );
        }

        const data = await request.json();
        const response = await postgrest.patch(`/transaction_type?transactiontype_id=eq.${id}`, data);
        return NextResponse.json(response.data[0]);
    } catch (error) {
        console.error('Transaction Type PATCH Error:', error);
        return NextResponse.json(
            { error: 'Failed to update transaction type' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('transactiontype_id');
        
        if (!id) {
            return NextResponse.json(
                { error: 'Transaction type ID is required' },
                { status: 400 }
            );
        }

        await postgrest.delete(`/transaction_type?transactiontype_id=eq.${id}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Transaction Type DELETE Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete transaction type' },
            { status: 500 }
        );
    }
}