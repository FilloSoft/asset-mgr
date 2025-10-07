import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/assetmgr';

if (!DATABASE_URL) {
  throw new Error('Please define the DATABASE_URL environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
  var db: ReturnType<typeof drizzle> | undefined;
}

let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === 'production') {
  db = drizzle(postgres(DATABASE_URL), { schema });
} else {
  if (!global.db) {
    global.db = drizzle(postgres(DATABASE_URL), { schema });
  }
  db = global.db;
}

export { db };
export default db;