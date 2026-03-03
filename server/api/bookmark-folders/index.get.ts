import { desc, eq, sql } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { bookmarkFolders, bookmarks } from '~~/lib/schema';

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

        const folders = await db
            .select({
                id: bookmarkFolders.id,
                name: bookmarkFolders.name,
                createdAt: bookmarkFolders.createdAt,
                bookmarkCount: sql<number>`count(${bookmarks.id})::int`,
            })
            .from(bookmarkFolders)
            .leftJoin(bookmarks, eq(bookmarkFolders.id, bookmarks.folderId))
            .where(eq(bookmarkFolders.userId, userId))
            .groupBy(bookmarkFolders.id)
            .orderBy(desc(bookmarkFolders.createdAt));

        return folders;
    } catch (error: any) {
        console.error('[bookmark-folders.get] Error:', error);
        if (error?.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch bookmark folders',
        });
    }
});
