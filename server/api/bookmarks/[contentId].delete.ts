import { and, eq } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { bookmarks } from '~~/lib/schema';

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

        const contentId = parseInt(getRouterParam(event, 'contentId') || '');

        if (isNaN(contentId)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid content ID',
            });
        }

        await db
            .delete(bookmarks)
            .where(
                and(
                    eq(bookmarks.userId, userId),
                    eq(bookmarks.contentId, contentId)
                )
            );

        return { success: true, bookmarked: false };
    } catch (error: any) {
        console.error('[bookmarks.delete] Error:', error);
        if (error?.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to remove bookmark',
        });
    }
});
