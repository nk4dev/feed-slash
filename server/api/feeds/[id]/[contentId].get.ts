import { db } from '~~/lib/db';
import { feedContent, feedMetaData } from '~~/lib/schema';
import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const idParam = event.context.params?.id;
  const contentIdParam = event.context.params?.contentId;

  const id = Number(idParam);
  const contentId = Number(contentIdParam);

  if (!idParam || Number.isNaN(id) || !contentIdParam || Number.isNaN(contentId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid feed or content id',
    });
  }

  try {
    const [feed] = await db
      .select()
      .from(feedMetaData)
      .where(eq(feedMetaData.id, id))
      .limit(1);

    if (!feed) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Feed not found',
      });
    }

    const [item] = await db
      .select()
      .from(feedContent)
      .where(and(eq(feedContent.parentId, id), eq(feedContent.contentId, contentId)))
      .limit(1);

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Content not found',
      });
    }

    return {
      feed,
      item,
    };
  } catch (error: any) {
    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch content',
      data: error.message,
    });
  }
});
