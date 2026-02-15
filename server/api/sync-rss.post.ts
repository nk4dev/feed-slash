import { desc } from "drizzle-orm";
import { db } from "~~/lib/db";
import { rssFeeds } from "~~/lib/schema";
import { fetchAndParseRssFeed } from "~~/server/utils/rssParser";

const DEFAULT_RSS_URL =
  "https://forest.watch.impress.co.jp/data/rss/1.0/wf/feed.rdf";

const MAX_SYNC_ITEMS = 80;

export default defineEventHandler(async () => {
  try {
    const parsedItems = await fetchAndParseRssFeed(DEFAULT_RSS_URL, 9000);
    const nextItems = parsedItems.slice(0, MAX_SYNC_ITEMS);

    if (nextItems.length === 0) {
      return {
        ok: true,
        insertedOrUpdated: 0,
        message: "No items found in RSS feed",
      };
    }

    for (const item of nextItems) {
      await db
        .insert(rssFeeds)
        .values({
          title: item.title,
          link: item.link,
          description: item.description,
          publishedAt: item.publishedAt,
        })
        .onConflictDoUpdate({
          target: rssFeeds.link,
          set: {
            title: item.title,
            description: item.description,
            publishedAt: item.publishedAt,
          },
        });
    }

    const latest = await db
      .select()
      .from(rssFeeds)
      .orderBy(desc(rssFeeds.publishedAt), desc(rssFeeds.createdAt))
      .limit(1);

    return {
      ok: true,
      source: DEFAULT_RSS_URL,
      insertedOrUpdated: nextItems.length,
      latestPublishedAt: latest[0]?.publishedAt ?? null,
    };
  } catch (error: any) {
    console.error("[sync-rss.post] sync failed", error);

    if (error?.name === "AbortError") {
      throw createError({
        statusCode: 504,
        statusMessage: "RSS sync timed out",
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to sync RSS feed",
      data: {
        message: error?.message ?? "Unknown error",
      },
    });
  }
});
