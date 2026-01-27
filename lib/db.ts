import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment variable or default
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nuxt-rss-feed';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
