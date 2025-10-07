import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { users, loginSchema } from '@/db/schema';
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validatedData = loginSchema.parse(body);
    
    // Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Verify the password
    const isValidPassword = await verifyPassword(validatedData.password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Create session
    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    
    // Set the session cookie
    await setSessionCookie(token);
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      message: 'Login successful',
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}