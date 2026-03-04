import { and, desc, eq } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { apiTokens, feedContent, feedMetaData } from '~~/lib/schema';
import { getTokenPreview, hashApiToken } from '~~/server/utils/apiToken';

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
      return { message: 'Usage: /api/agents?token=YOUR_TOKEN&feedId=OPTIONAL', version: '0.0.2' };
    }

    const tokenHash = hashApiToken(token);

    let [tokenRow] = await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.tokenHash, tokenHash))
      .limit(1);

    // Legacy plaintext fallback for old tokens. On success, backfill hash metadata.
    if (!tokenRow) {
      const [legacyTokenRow] = await db
        .select()
        .from(apiTokens)
        .where(eq(apiTokens.token, token))
        .limit(1);
      if (legacyTokenRow) {
        await db
          .update(apiTokens)
          .set({
            tokenHash,
            tokenPrefix: legacyTokenRow.tokenPrefix || getTokenPreview(token),
            token: null,
          })
          .where(eq(apiTokens.id, legacyTokenRow.id));
        tokenRow = {
          ...legacyTokenRow,
          tokenHash,
          tokenPrefix: legacyTokenRow.tokenPrefix || getTokenPreview(token),
          token: null,
        };
      }
    }

    if (!tokenRow) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
    }

    if (tokenRow.expiresAt && tokenRow.expiresAt.getTime() < Date.now()) {
      throw createError({ statusCode: 401, statusMessage: 'Token expired' });
    }

    await db
      .update(apiTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiTokens.id, tokenRow.id));

    const userId = tokenRow.userId;

    // Optional filters
    const feedIdParam = query.feedId ? Number(query.feedId) : null;
    if (feedIdParam !== null && Number.isNaN(feedIdParam)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid feedId parameter' });
    }

    // Build where conditions
    const conditions = [eq(feedMetaData.userId, userId)];
    if (feedIdParam !== null) conditions.push(eq(feedMetaData.id, feedIdParam));

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
    if (error?.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch agent feed', data: error.message });
  }
});
