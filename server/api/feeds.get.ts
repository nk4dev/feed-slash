import { db } from '~~/lib/db';
import { feedMetaData } from '~~/lib/schema';
import { desc, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  try {
    const auth = await event.context.auth();
    
    const { userId } = auth || {};
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    const feeds = await db.select()
      .from(feedMetaData)
      .where(eq(feedMetaData.userId, userId))
      .orderBy(desc(feedMetaData.createdAt));
      
    console.log('[feeds.get] Fetched feeds count:', feeds.length);
    return feeds;
  } catch (error: any) {
    console.error('[feeds.get] Error:', error);
    
    if (error?.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch feeds',
      data: error.message
    });
  }
});
