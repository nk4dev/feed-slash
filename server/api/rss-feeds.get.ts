import { desc } from "drizzle-orm";
import { db } from "~~/lib/db";
import { rssFeeds } from "~~/lib/schema";

const DEFAULT_LIMIT = 50;

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, 100);

    const items = await db
      .select()
      .from(rssFeeds)
      .orderBy(desc(rssFeeds.publishedAt), desc(rssFeeds.createdAt))
      .limit(limit);

    return {
      ok: true,
      count: items.length,
      items,
    };
  } catch (error: any) {
    console.error("[rss-feeds.get] failed", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch RSS articles",
      data: {
        message: error?.message ?? "Unknown error",
      },
    });
  }
});
