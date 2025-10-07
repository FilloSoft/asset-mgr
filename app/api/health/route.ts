import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // You could add database health check here if needed
    // const db = await getDatabase();
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'asset-manager'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable'
      },
      { status: 500 }
    );
  }
}