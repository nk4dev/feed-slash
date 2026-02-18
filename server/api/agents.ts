import { and, desc, eq } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { feedContent, feedMetaData } from '~~/lib/schema';

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

    // Optional query parameter: ?feedId=<number>
    const query = getQuery(event);
    const feedIdParam = query.feedId ? Number(query.feedId) : null;

    if (feedIdParam !== null && Number.isNaN(feedIdParam)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid feedId parameter',
      });
    }

    // Build where conditions
    const conditions = [eq(feedMetaData.userId, userId)];
    if (feedIdParam !== null) {
      conditions.push(eq(feedMetaData.id, feedIdParam));
    }

    // Fetch feed contents joined with metadata
    const items = await db
      .select({
        contentId: feedContent.contentId,
        title: feedContent.title,
        contentUrl: feedContent.contentUrl,
        contentSnippet: feedContent.contentSnippet,
        author: feedContent.author,
        publishedAt: feedContent.publishedAt,
        feedTitle: feedMetaData.title,
      })
      .from(feedContent)
      .innerJoin(feedMetaData, eq(feedContent.parentId, feedMetaData.id))
      .where(and(...conditions))
      .orderBy(desc(feedContent.publishedAt), desc(feedContent.contentId));

    // Build compact plain text (AI-optimized, token-saving)
    const d = (dt: Date) => dt.toISOString().split('T')[0];
    const lines: string[] = [`#${items.length} ${d(new Date())}`];
    for (const i of items) {
      const parts = [i.title ?? '', i.contentUrl, i.author ?? '', i.publishedAt ? d(i.publishedAt) : '', i.contentSnippet ?? '', i.feedTitle ?? ''];
      lines.push(parts.join('|'));
    }
    if (items.length === 0) lines.push('empty');
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
    return lines.join('\n');
  } catch (error: any) {
    console.error('[agents] Error:', error);

    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch agent feed',
      data: error.message,
    });
  }
});