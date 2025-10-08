import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { createDatabaseClient } from "@/lib/database";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL environment variable");
  process.exit(1);
}

async function runMigrations() {
  const migrationClient = createDatabaseClient();
  const db = drizzle(migrationClient);

  try {
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await migrationClient.end({ timeout: 5 });
  }
}

runMigrations();
