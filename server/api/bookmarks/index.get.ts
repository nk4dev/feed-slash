import { desc, eq } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { bookmarks, feedContent, feedMetaData } from '~~/lib/schema';

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

        const userBookmarks = await db
            .select({
                id: bookmarks.id,
                contentId: feedContent.contentId,
                title: feedContent.title,
                contentUrl: feedContent.contentUrl,
                contentSnippet: feedContent.contentSnippet,
                author: feedContent.author,
                publishedAt: feedContent.publishedAt,
                feedId: feedMetaData.id,
                feedTitle: feedMetaData.title,
                bookmarkedAt: bookmarks.createdAt,
            })
            .from(bookmarks)
            .innerJoin(feedContent, eq(bookmarks.contentId, feedContent.contentId))
            .innerJoin(feedMetaData, eq(feedContent.parentId, feedMetaData.id))
            .where(eq(bookmarks.userId, userId))
            .orderBy(desc(bookmarks.createdAt));

        return userBookmarks;
    } catch (error: any) {
        console.error('[bookmarks.get] Error:', error);
        if (error?.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch bookmarks',
        });
    }
});
