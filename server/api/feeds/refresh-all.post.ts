import { eq } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { feedContent, feedMetaData } from '~~/lib/schema';

function decodeXmlEntities(input: string): string {
    return input
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function extractTagValue(xml: string, tagName: string): string {
    const cdataRegex = new RegExp(`<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tagName}>`, 'i');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch?.[1]) return cdataMatch[1].trim();

    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match?.[1]?.trim() ?? '';
}

function extractFirstTagValue(xml: string, tagNames: string[]): string {
    for (const tagName of tagNames) {
        const value = extractTagValue(xml, tagName);
        if (value) return value;
    }
    return '';
}

function parseRssFeed(xml: string) {
    const channelMatch = xml.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i);
    const channelXml = channelMatch?.[1] ?? xml;

    const title = decodeXmlEntities(extractTagValue(channelXml, 'title'));
    const link = decodeXmlEntities(extractTagValue(channelXml, 'link'));
    const description = decodeXmlEntities(extractTagValue(channelXml, 'description'));

    const items: Array<{
        title: string;
        link: string;
        guid: string;
        content: string;
        description: string;
        author: string;
        pubDate: string;
    }> = [];

    const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(channelXml)) !== null) {
        const itemXml = match[1];
        if (!itemXml) continue;

        const itemTitle = decodeXmlEntities(extractTagValue(itemXml, 'title'));
        const itemLink = decodeXmlEntities(extractTagValue(itemXml, 'link'));
        const itemGuid = decodeXmlEntities(extractTagValue(itemXml, 'guid'));
        const itemContent = decodeXmlEntities(extractTagValue(itemXml, 'content:encoded'));
        const itemDescription = decodeXmlEntities(extractTagValue(itemXml, 'description'));
        const itemAuthor = decodeXmlEntities(extractFirstTagValue(itemXml, ['dc:creator', 'author']));
        const itemPubDate = extractFirstTagValue(itemXml, ['pubDate', 'dc:date']);

        items.push({
            title: itemTitle,
            link: itemLink,
            guid: itemGuid,
            content: itemContent,
            description: itemDescription,
            author: itemAuthor,
            pubDate: itemPubDate,
        });
    }

    return {
        title,
        link,
        description,
        items,
    };
}

// Parse Atom feed using native DOMParser-like approach
function parseAtomFeed(xml: string) {
    const entries: Array<{
        id: string;
        title: string;
        link: string;
        content: string;
        author: string;
        published: string;
        updated: string;
    }> = [];

    // Extract feed metadata
    const titleMatch = xml.match(/<title>([^<]*)<\/title>/);
    const linkMatch = xml.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/);

    const feedTitle = titleMatch?.[1] ?? '';
    const feedLink = linkMatch?.[1] ?? '';

    // Extract entries
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
        const entryXml = match[1];
        if (!entryXml) continue;

        const idMatch = entryXml.match(/<id>([^<]*)<\/id>/);
        const entryTitleMatch = entryXml.match(/<title>([^<]*)<\/title>/);
        const entryLinkMatch = entryXml.match(/<link[^>]+href=["']([^"']+)["']/);
        const contentMatch = entryXml.match(/<content[^>]*>([^<]*)<\/content>/);
        const authorMatch = entryXml.match(/<author>\s*<name>([^<]*)<\/name>/);
        const publishedMatch = entryXml.match(/<published>([^<]*)<\/published>/);
        const updatedMatch = entryXml.match(/<updated>([^<]*)<\/updated>/);

        entries.push({
            id: idMatch?.[1] ?? '',
            title: entryTitleMatch?.[1] ?? '',
            link: entryLinkMatch?.[1]?.replace(/&amp;/g, '&') ?? '',
            content: contentMatch?.[1] ?? '',
            author: authorMatch?.[1] ?? '',
            published: publishedMatch?.[1] ?? '',
            updated: updatedMatch?.[1] ?? '',
        });
    }

    return {
        title: feedTitle,
        link: feedLink,
        entries,
    };
}

// Detect if XML is Atom format
function isAtomFeed(xml: string): boolean {
    return xml.includes('xmlns="http://www.w3.org/2005/Atom"') || xml.includes('<feed');
}

// フィード1つを更新する関数
async function refreshSingleFeed(feedUrl: string, userId: string, feedId: number) {
    try {
        const response = await fetch(feedUrl);
        if (!response.ok) {
            return { success: false, feedUrl, error: `HTTP ${response.status}` };
        }

        const xml = await response.text();
        const isAtom = isAtomFeed(xml);

        let feedTitle: string | undefined;
        let feedLink: string | undefined;
        let feedDescription: string | undefined;

        let parsedAtom: ReturnType<typeof parseAtomFeed> | null = null;
        let parsedRss: ReturnType<typeof parseRssFeed> | null = null;

        if (isAtom) {
            parsedAtom = parseAtomFeed(xml);
            feedTitle = parsedAtom.title;
            feedLink = parsedAtom.link;
        } else {
            parsedRss = parseRssFeed(xml);
            feedTitle = parsedRss.title;
            feedLink = parsedRss.link;
            feedDescription = parsedRss.description;
        }

        // Update feed metadata
        await db
            .update(feedMetaData)
            .set({
                title: feedTitle ?? null,
                remoteUrl: feedLink ?? null,
                description: feedDescription ?? null,
                updatedAt: new Date(),
            })
            .where(eq(feedMetaData.id, feedId));

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

        if (isAtom && parsedAtom) {
            items = parsedAtom.entries
                .filter((entry) => entry.link)
                .map((entry) => ({
                    parentId: feedId,
                    contentUrl: entry.link,
                    title: entry.title || null,
                    content: entry.content || null,
                    contentSnippet: entry.content?.substring(0, 200) || null,
                    author: entry.author || null,
                    publishedAt: entry.published ? new Date(entry.published) : entry.updated ? new Date(entry.updated) : null,
                }));
        } else if (parsedRss) {
            items = (parsedRss.items ?? [])
                .map((item) => {
                    const contentUrl = item.link || item.guid || undefined;
                    if (!contentUrl) return null;

                    const publishedAt = item.pubDate ? new Date(item.pubDate) : null;

                    const content = item.content || item.description || null;
                    const contentSnippet = item.description?.substring(0, 200) || content?.substring(0, 200) || null;

                    return {
                        parentId: feedId,
                        contentUrl,
                        title: item.title ?? null,
                        content,
                        contentSnippet,
                        author: item.author || null,
                        publishedAt,
                    };
                })
                .filter((item): item is NonNullable<typeof item> => Boolean(item));
        }

        if (items.length > 0) {
            await db
                .insert(feedContent)
                .values(items)
                .onConflictDoNothing({ target: [feedContent.parentId, feedContent.contentUrl] });
        }

        return { success: true, feedUrl, itemsFetched: items.length };
    } catch (error: any) {
        return { success: false, feedUrl, error: error.message };
    }
}

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

        // ユーザーの全フィードを取得
        const feeds = await db
            .select()
            .from(feedMetaData)
            .where(eq(feedMetaData.userId, userId));

        if (feeds.length === 0) {
            return {
                message: 'No feeds to refresh',
                results: [],
            };
        }

        // 全フィードを順次更新
        const results = [];
        for (const feed of feeds) {
            const result = await refreshSingleFeed(feed.feedUrl, userId, feed.id);
            results.push(result);
        }

        const successCount = results.filter(r => r.success).length;
        const totalItems = results.reduce((sum, r) => sum + (r.itemsFetched || 0), 0);

        return {
            message: `${successCount}/${feeds.length} feeds refreshed successfully`,
            totalItems,
            results,
        };
    } catch (error: any) {
        console.error('[feeds/refresh-all] Error:', error);

        if (error?.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to refresh feeds',
            data: error.message,
        });
    }
});
