import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof drizzle>;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL environment variable");
}

const isProduction = process.env.NODE_ENV === "production";

function createPostgresClient(): PostgresClient {
  const sslOption = process.env.DATABASE_SSL?.toLowerCase();
  const ssl =
    sslOption === "true" || sslOption === "require"
      ? {
          rejectUnauthorized:
            process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
        }
      : undefined;

  return postgres(DATABASE_URL as string, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30,
    ssl,
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __dbClient: PostgresClient | undefined;
  // eslint-disable-next-line no-var
  var __db: DrizzleDb | undefined;
}

const client: PostgresClient = (() => {
  if (isProduction) {
    return createPostgresClient();
  }

  if (!global.__dbClient) {
    global.__dbClient = createPostgresClient();
  }

  return global.__dbClient;
})();

export function createDatabaseClient(): PostgresClient {
  return createPostgresClient();
}

const db: DrizzleDb = (() => {
  if (isProduction) {
    return drizzle(client, { schema });
  }

  if (!global.__db) {
    global.__db = drizzle(client, { schema });
  }

  return global.__db;
})();

export { db, client as postgresClient };
export default db;
