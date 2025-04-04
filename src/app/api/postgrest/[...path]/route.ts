import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * This API route acts as a proxy for PostgREST requests.
 * It forwards all requests to the PostgREST server running on the server side,
 * preventing client-side direct connections to localhost:3000.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${process.env.POSTGREST_URL || 'http://localhost:3000'}/${path}${searchParams ? `?${searchParams}` : ''}`;

  console.log(`[PostgREST Proxy] GET ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('[PostgREST Proxy] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch data from PostgREST' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const url = `${process.env.POSTGREST_URL || 'http://localhost:3000'}/${path}`;

  console.log(`[PostgREST Proxy] POST ${url}`);

  try {
    const body = await request.json();
    const response = await axios.post(url, body, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('[PostgREST Proxy] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to post data to PostgREST' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const url = `${process.env.POSTGREST_URL || 'http://localhost:3000'}/${path}`;

  console.log(`[PostgREST Proxy] PATCH ${url}`);

  try {
    const body = await request.json();
    const response = await axios.patch(url, body, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('[PostgREST Proxy] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to patch data in PostgREST' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${process.env.POSTGREST_URL || 'http://localhost:3000'}/${path}${searchParams ? `?${searchParams}` : ''}`;

  console.log(`[PostgREST Proxy] DELETE ${url}`);

  try {
    const response = await axios.delete(url, {
      headers: {
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('[PostgREST Proxy] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to delete data from PostgREST' },
      { status: error.response?.status || 500 }
    );
  }
}

// Define segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
