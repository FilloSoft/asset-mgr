import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const JWT_ALGORITHM = 'HS256';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  exp: number;
  [key: string]: any; // Add index signature for JWT compatibility
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a JWT token for a user session
 */
export async function createSession(userPayload: { userId: string; email: string; name: string }): Promise<string> {
  const expirationTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
  
  const session: SessionPayload = {
    userId: userPayload.userId,
    email: userPayload.email,
    name: userPayload.name,
    exp: expirationTime,
  };

  return new SignJWT(session)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Validate that the payload has the expected structure
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.name === 'string' &&
      typeof payload.exp === 'number'
    ) {
      return payload as SessionPayload;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get the current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Get the current session from a NextRequest (for middleware)
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get('session')?.value;
  
  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Set the session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}