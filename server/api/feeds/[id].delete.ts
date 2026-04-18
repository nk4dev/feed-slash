import { and, eq, inArray } from 'drizzle-orm';
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

        const idParam = event.context.params?.id;
        const feedId = Number(idParam);

        if (!idParam || Number.isNaN(feedId)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid feed id',
            });
        }

        const [feed] = await db
            .select({ id: feedMetaData.id })
            .from(feedMetaData)
            .where(and(eq(feedMetaData.id, feedId), eq(feedMetaData.userId, userId)))
            .limit(1);

        if (!feed) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Feed not found',
            });
        }

        const feedItems = await db
            .select({ contentId: feedContent.contentId })
            .from(feedContent)
            .where(eq(feedContent.parentId, feedId));

        const contentIds = feedItems.map((item) => item.contentId);

        await db.transaction(async (tx) => {
            if (contentIds.length > 0) {
                await tx
                    .delete(bookmarks)
                    .where(inArray(bookmarks.contentId, contentIds));
            }

            await tx.delete(feedContent).where(eq(feedContent.parentId, feedId));
            await tx
                .delete(feedMetaData)
                .where(and(eq(feedMetaData.id, feedId), eq(feedMetaData.userId, userId)));
        });

        return { success: true };
    } catch (error: any) {
        console.error('[feeds/[id].delete] Error:', error);

        if (error?.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete feed',
            data: error.message,
        });
    }
});