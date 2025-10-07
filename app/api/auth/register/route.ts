import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { users, insertUserSchema, User } from '@/db/schema';
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input
    const validatedData = insertUserSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create the user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      });
    
    // Create session
    const token = await createSession({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });
    
    // Set the session cookie
    await setSessionCookie(token);
    
    return NextResponse.json({
      user: newUser,
      message: 'User created successfully',
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
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