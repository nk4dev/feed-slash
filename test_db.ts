
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { feedMetaData } from './lib/schema';

const connectionString = process.env.FEED_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nuxt-feed';

console.log('Connecting to:', connectionString);

async function main() {
  try {
    const client = postgres(connectionString, { prepare: false });
    const db = drizzle(client);

    console.log('Inserting feed...');
    const result = await db.insert(feedMetaData).values({
      userId: 'test-user',
      feedUrl: 'https://test-feed.com/rss/2',
      updatedAt: new Date(),
    }).returning();
    
    console.log('Inserted:', result);
    
    await client.end();
  } catch (err) {
    console.error('DB Error:', err);
  }
}

main();
