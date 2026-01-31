import { and, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { bookmarks, feedContent, feedMetaData } from '~~/lib/schema';

export default defineEventHandler(async (event) => {
    try {
        // 認証チェック
        const auth = await event.context.auth();
        const { userId } = auth || {};

        if (!userId) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized - Please log in to view your digest',
            });
        }

        // 今日の日付の範囲を取得（UTC）
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        // ユーザーのフィードに紐づく今日のコンテンツを取得
        const todayContents = await db
            .select({
                contentId: feedContent.contentId,
                title: feedContent.title,
                contentUrl: feedContent.contentUrl,
                contentSnippet: feedContent.contentSnippet,
                author: feedContent.author,
                publishedAt: feedContent.publishedAt,
                feedId: feedMetaData.id,
                feedTitle: feedMetaData.title,
                feedUrl: feedMetaData.feedUrl,
            })
            .from(feedContent)
            .innerJoin(feedMetaData, eq(feedContent.parentId, feedMetaData.id))
            .where(
                and(
                    eq(feedMetaData.userId, userId),
                    gte(feedContent.publishedAt, startOfDay),
                    lt(feedContent.publishedAt, endOfDay)
                )
            )
            .orderBy(desc(feedContent.publishedAt));

        // ユーザーのブックマーク一覧を取得
        const contentIds = todayContents.map(c => c.contentId);
        let bookmarkedIds: Set<number> = new Set();

        if (contentIds.length > 0) {
            const userBookmarks = await db
                .select({ contentId: bookmarks.contentId })
                .from(bookmarks)
                .where(
                    and(
                        eq(bookmarks.userId, userId),
                        inArray(bookmarks.contentId, contentIds)
                    )
                );
            bookmarkedIds = new Set(userBookmarks.map(b => b.contentId));
        }

        // ブックマーク情報を含めたコンテンツを返す
        const itemsWithBookmarks = todayContents.map(item => ({
            ...item,
            isBookmarked: bookmarkedIds.has(item.contentId),
        }));

        console.log('[daily] Fetched today\'s contents count:', todayContents.length);

        return {
            date: startOfDay.toISOString().split('T')[0],
            count: todayContents.length,
            items: itemsWithBookmarks,
        };
    } catch (error: any) {
        console.error('[daily] Error:', error);

        if (error?.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch daily digest',
            data: error.message
        });
    }
});