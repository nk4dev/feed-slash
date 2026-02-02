import { eq } from 'drizzle-orm';
import Parser from 'rss-parser';
import { db } from '~~/lib/db';
import { feedContent, feedMetaData } from '~~/lib/schema';

// Atom/RSS parser with custom fields for Atom support
const parser = new Parser({
    customFields: {
        item: [
            ['content', 'atomContent'],
            ['author', 'atomAuthor', { keepArray: false }],
        ],
    },
});

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
        let parsedRss: Awaited<ReturnType<typeof parser.parseString>> | null = null;

        if (isAtom) {
            parsedAtom = parseAtomFeed(xml);
            feedTitle = parsedAtom.title;
            feedLink = parsedAtom.link;
        } else {
            parsedRss = await parser.parseString(xml);
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
                    const contentUrl = item.link || (typeof item.guid === 'string' ? item.guid : undefined);
                    if (!contentUrl) return null;

                    const publishedAt = item.isoDate
                        ? new Date(item.isoDate)
                        : item.pubDate
                            ? new Date(item.pubDate)
                            : null;

                    const author =
                        typeof (item as any).creator === 'string'
                            ? (item as any).creator
                            : typeof (item as any).author === 'string'
                                ? (item as any).author
                                : (item as any).author?.name ?? null;

                    const content =
                        (item as any)['content:encoded'] || item.content || (item as any).atomContent || null;

                    return {
                        parentId: feedId,
                        contentUrl,
                        title: item.title ?? null,
                        content,
                        contentSnippet: item.contentSnippet ?? null,
                        author,
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
