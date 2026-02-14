import { and, eq } from "drizzle-orm";
import { db } from "~~/lib/db";
import { feedContent, feedMetaData } from "~~/lib/schema";

type ParsedFeedItem = {
  contentUrl: string;
  title: string | null;
  content: string | null;
  contentSnippet: string | null;
  author: string | null;
  publishedAt: Date | null;
};

type ParsedFeed = {
  title: string | null;
  link: string | null;
  description: string | null;
  items: ParsedFeedItem[];
};

function stripCdata(value: string): string {
  return value.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, "$1");
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function normalizeText(value?: string): string | null {
  if (!value) {
    return null;
  }

  const text = decodeXmlEntities(stripTags(stripCdata(value)))
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

function normalizeContent(value?: string): string | null {
  if (!value) {
    return null;
  }

  const content = decodeXmlEntities(stripCdata(value)).trim();
  return content || null;
}

function extractFirstTagValue(xml: string, tags: string[]): string | undefined {
  for (const tag of tags) {
    const exactRegex = new RegExp(
      `<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`,
      "i",
    );
    const exactMatch = xml.match(exactRegex);
    if (exactMatch?.[1]) {
      return exactMatch[1];
    }

    if (!tag.includes(":")) {
      const namespacedRegex = new RegExp(
        `<[^\\s:>]+:${tag}\\b[^>]*>([\\s\\S]*?)<\\/[^\\s:>]+:${tag}>`,
        "i",
      );
      const namespacedMatch = xml.match(namespacedRegex);
      if (namespacedMatch?.[1]) {
        return namespacedMatch[1];
      }
    }
  }

  return undefined;
}

function extractTagBlocks(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    if (match[1]) {
      blocks.push(match[1]);
    }
  }

  return blocks;
}

function extractChannelXml(xml: string): string {
  const channel = xml.match(/<channel\b[^>]*>([\s\S]*?)<\/channel>/i);
  return channel?.[1] ?? xml;
}

function parseDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function extractAtomLink(xml: string): string | null {
  const linkRegex = /<link\b([^>]*)\/?>(?:<\/link>)?/gi;
  let fallbackHref: string | null = null;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(xml)) !== null) {
    const attributes = match[1] ?? "";
    const hrefMatch = attributes.match(/\shref=["']([^"']+)["']/i);
    if (!hrefMatch?.[1]) {
      continue;
    }

    const href = decodeXmlEntities(hrefMatch[1]);
    if (!fallbackHref) {
      fallbackHref = href;
    }

    const relMatch = attributes.match(/\srel=["']([^"']+)["']/i);
    const rel = relMatch?.[1]?.toLowerCase();
    if (!rel || rel === "alternate") {
      return href;
    }
  }

  return fallbackHref;
}

function buildSnippet(
  content: string | null,
  fallback: string | null,
): string | null {
  if (fallback) {
    return fallback;
  }

  if (!content) {
    return null;
  }

  const plain = normalizeText(content);
  if (!plain) {
    return null;
  }

  return plain.length > 200 ? plain.slice(0, 200) : plain;
}

function isAtomFeed(xml: string): boolean {
  return /<feed\b/i.test(xml) && /http:\/\/www\.w3\.org\/2005\/Atom/i.test(xml);
}

function parseAtomFeed(xml: string): ParsedFeed {
  const title = normalizeText(extractFirstTagValue(xml, ["title"]));
  const link = firstNonEmpty(
    extractAtomLink(xml),
    normalizeText(extractFirstTagValue(xml, ["id"])),
  );
  const entries = extractTagBlocks(xml, "entry");

  const items: ParsedFeedItem[] = entries
    .map((entryXml) => {
      const entryLink = firstNonEmpty(
        extractAtomLink(entryXml),
        normalizeText(extractFirstTagValue(entryXml, ["id"])),
      );

      if (!entryLink) {
        return null;
      }

      const content = firstNonEmpty(
        normalizeContent(extractFirstTagValue(entryXml, ["content"])),
        normalizeContent(extractFirstTagValue(entryXml, ["summary"])),
      );

      const contentSnippet = buildSnippet(
        content,
        normalizeText(extractFirstTagValue(entryXml, ["summary"])),
      );
      const publishedAt = parseDate(
        firstNonEmpty(
          normalizeText(extractFirstTagValue(entryXml, ["published"])),
          normalizeText(extractFirstTagValue(entryXml, ["updated"])),
        ),
      );

      const author = firstNonEmpty(
        normalizeText(extractFirstTagValue(entryXml, ["author"])),
        normalizeText(extractFirstTagValue(entryXml, ["name"])),
      );

      return {
        contentUrl: entryLink,
        title: normalizeText(extractFirstTagValue(entryXml, ["title"])),
        content,
        contentSnippet,
        author,
        publishedAt,
      };
    })
    .filter((item): item is ParsedFeedItem => Boolean(item));

  return {
    title,
    link,
    description: null,
    items,
  };
}

function parseRssFeed(xml: string): ParsedFeed {
  const channelXml = extractChannelXml(xml);
  const itemsXml = extractTagBlocks(channelXml, "item");

  const items: ParsedFeedItem[] = itemsXml
    .map((itemXml) => {
      const contentUrl = firstNonEmpty(
        normalizeText(extractFirstTagValue(itemXml, ["link"])),
        normalizeText(extractFirstTagValue(itemXml, ["guid"])),
      );

      if (!contentUrl) {
        return null;
      }

      const content = firstNonEmpty(
        normalizeContent(extractFirstTagValue(itemXml, ["content:encoded"])),
        normalizeContent(extractFirstTagValue(itemXml, ["encoded"])),
        normalizeContent(extractFirstTagValue(itemXml, ["content"])),
        normalizeContent(extractFirstTagValue(itemXml, ["description"])),
      );

      const contentSnippet = buildSnippet(
        content,
        normalizeText(extractFirstTagValue(itemXml, ["description"])),
      );

      const author = firstNonEmpty(
        normalizeText(extractFirstTagValue(itemXml, ["dc:creator"])),
        normalizeText(extractFirstTagValue(itemXml, ["creator"])),
        normalizeText(extractFirstTagValue(itemXml, ["author"])),
      );

      const publishedAt = parseDate(
        firstNonEmpty(
          normalizeText(extractFirstTagValue(itemXml, ["isoDate"])),
          normalizeText(extractFirstTagValue(itemXml, ["pubDate"])),
          normalizeText(extractFirstTagValue(itemXml, ["dc:date"])),
        ),
      );

      return {
        contentUrl,
        title: normalizeText(extractFirstTagValue(itemXml, ["title"])),
        content,
        contentSnippet,
        author,
        publishedAt,
      };
    })
    .filter((item): item is ParsedFeedItem => Boolean(item));

  return {
    title: normalizeText(extractFirstTagValue(channelXml, ["title"])),
    link: normalizeText(extractFirstTagValue(channelXml, ["link"])),
    description: normalizeText(
      extractFirstTagValue(channelXml, ["description"]),
    ),
    items,
  };
}

function parseFeedXml(xml: string): ParsedFeed {
  return isAtomFeed(xml) ? parseAtomFeed(xml) : parseRssFeed(xml);
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await event.context.auth();
    console.log("[feeds.post] Auth result:", auth);

    const { userId } = auth || {};
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    const body = await readBody(event);

    // Basic validation
    if (!body.feedUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: "Feed URL is required",
      });
    }

    const response = await fetch(body.feedUrl);
    if (!response.ok) {
      throw createError({
        statusCode: 400,
        statusMessage: `Failed to fetch feed (HTTP ${response.status})`,
      });
    }

    const xml = await response.text();

    const parsedFeed = parseFeedXml(xml);

    const [existingFeed] = await db
      .select()
      .from(feedMetaData)
      .where(
        and(
          eq(feedMetaData.userId, userId),
          eq(feedMetaData.feedUrl, body.feedUrl),
        ),
      )
      .limit(1);

    const metaValues = {
      userId,
      feedUrl: body.feedUrl,
      title: parsedFeed.title,
      remoteUrl: parsedFeed.link,
      description: parsedFeed.description,
      updatedAt: new Date(),
    };

    const [feedRow] = existingFeed
      ? await db
          .update(feedMetaData)
          .set(metaValues)
          .where(eq(feedMetaData.id, existingFeed.id))
          .returning()
      : await db.insert(feedMetaData).values(metaValues).returning();

    if (!feedRow) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to process feed metadata",
      });
    }

    // Build items based on feed type
    let items: Array<{
      parentId: number;
      contentUrl: string;
      title: string | null;
      content: string | null;
      contentSnippet: string | null;
      author: string | null;
      publishedAt: Date | null;
    }> = [];

    items = parsedFeed.items.map((item) => ({
      parentId: feedRow.id,
      contentUrl: item.contentUrl,
      title: item.title,
      content: item.content,
      contentSnippet: item.contentSnippet,
      author: item.author,
      publishedAt: item.publishedAt,
    }));

    if (items.length > 0) {
      await db
        .insert(feedContent)
        .values(items)
        .onConflictDoNothing({
          target: [feedContent.parentId, feedContent.contentUrl],
        });
    }

    return {
      feed: feedRow,
      itemsFetched: items.length,
    };
  } catch (error: any) {
    // Log the full error for debugging
    console.error("[feeds.post] Error:", error);

    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to add feed",
      data: error.message,
    });
  }
});
