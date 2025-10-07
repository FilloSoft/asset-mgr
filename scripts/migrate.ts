import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/assetmgr';

async function runMigrations() {
  try {
    // Create connection for migrations
    const migrationClient = postgres(DATABASE_URL, { max: 1 });
    const db = drizzle(migrationClient);
    
    // Run migrations
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './db/migrations' });
    console.log('✅ Migrations completed successfully');
    
    // Close connection
    await migrationClient.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();