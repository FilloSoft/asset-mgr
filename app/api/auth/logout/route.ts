import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie
    await clearSessionCookie();
    
    return NextResponse.json({
      message: 'Logout successful',
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}