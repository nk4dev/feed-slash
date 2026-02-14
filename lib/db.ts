import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import * as schema from "./schema";

// Connection string from environment variable or default
const connectionString =
  process.env.FEED_DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/nuxt-rss-feed";

const isNeonConnectionString = (() => {
  try {
    return new URL(connectionString).hostname.endsWith(".neon.tech");
  } catch {
    return connectionString.includes(".neon.tech");
  }
})();

if (isNeonConnectionString) {
  neonConfig.poolQueryViaFetch = true;
}

const dbInstance = isNeonConnectionString
  ? drizzleNeon(new NeonPool({ connectionString }), { schema })
  : drizzlePg(new PgPool({ connectionString }), { schema });

export const db = dbInstance;
