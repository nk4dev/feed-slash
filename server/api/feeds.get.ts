import { db } from '~~/lib/db';
import { feedMetaData } from '~~/lib/schema';
import { desc } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const feeds = await db.select()
      .from(feedMetaData)
      .orderBy(desc(feedMetaData.createdAt));
      
    return feeds;
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch feeds',
      data: error.message
    });
  }
});
