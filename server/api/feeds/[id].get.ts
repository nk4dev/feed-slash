import { db } from '~~/lib/db';
import { feedContent, feedMetaData } from '~~/lib/schema';
import { eq, desc, and } from 'drizzle-orm';

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

    const idParam = event.context.params?.id;
    const id = Number(idParam);

    if (!idParam || Number.isNaN(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid feed id',
      });
    }
    const [feed] = await db
      .select()
      .from(feedMetaData)
      .where(and(eq(feedMetaData.id, id), eq(feedMetaData.userId, userId)))
      .limit(1);

    if (!feed) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Feed not found',
      });
    }

    const items = await db
      .select()
      .from(feedContent)
      .where(eq(feedContent.parentId, id))
      .orderBy(desc(feedContent.publishedAt), desc(feedContent.contentId));

    return {
      feed,
      items,
    };
  } catch (error: any) {
    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch feed content',
      data: error.message,
    });
  }
});
