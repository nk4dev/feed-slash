import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment variable or default
const connectionString = process.env.FEED_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nuxt-rss-feed';

// Configure SSL for production databases (Neon requires SSL)
const client = postgres(connectionString, { 
  prepare: false,
  ssl: connectionString.includes('neon.tech') ? 'require' : false,
});

export const db = drizzle(client, { schema });
