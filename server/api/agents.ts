import { and, desc, eq } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { feedContent, feedMetaData } from '~~/lib/schema';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  // Allow CORS for external API consumers
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  });
  if (getMethod(event) === 'OPTIONS') return '';

  try {
    const token = query.token as string | undefined;

    if (!token) {
      return { message: 'Usage: /api/agents?token=YOUR_TOKEN&userId=YOUR_USER_ID&feedId=OPTIONAL' };
    }

    // Validate token against env var (no Clerk session required)
    const apiToken = process.env.NUXT_API_TOKEN;
    if (!apiToken || token !== apiToken) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
    }

    // Optional filters
    const userId = query.userId as string | undefined;
    const feedIdParam = query.feedId ? Number(query.feedId) : null;
    if (feedIdParam !== null && Number.isNaN(feedIdParam)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid feedId parameter' });
    }

    // Build where conditions
    const conditions = [];
    if (userId) conditions.push(eq(feedMetaData.userId, userId));
    if (feedIdParam !== null) conditions.push(eq(feedMetaData.id, feedIdParam));

    // Fetch feed contents joined with metadata
    const q = db
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
      .innerJoin(feedMetaData, eq(feedContent.parentId, feedMetaData.id));
    const items = await (conditions.length ? q.where(and(...conditions)) : q)
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
    if (error?.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch agent feed', data: error.message });
  }
});