import { and, eq } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { feedContent, feedMetaData } from '~~/lib/schema';

export default defineEventHandler(async (event) => {
  try {
    const authFn = event.context.auth;
    if (typeof authFn !== 'function') {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    let auth: Awaited<ReturnType<typeof authFn>> | null = null;
    try {
      auth = await authFn();
    } catch {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    const { userId } = auth || {};
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

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
    console.error('[feeds/[id]/[contentId].get] Error:', error);

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
