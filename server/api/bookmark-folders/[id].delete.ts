import { and, eq } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { bookmarkFolders } from '~~/lib/schema';

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

        const id = parseInt(getRouterParam(event, 'id') || '');

        if (isNaN(id)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid folder ID',
            });
        }

        // フォルダを削除（folderId は ON DELETE SET NULL で自動的に null になる）
        const result = await db
            .delete(bookmarkFolders)
            .where(
                and(
                    eq(bookmarkFolders.id, id),
                    eq(bookmarkFolders.userId, userId)
                )
            )
            .returning();

        if (result.length === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Folder not found',
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error('[bookmark-folders.delete] Error:', error);
        if (error?.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete bookmark folder',
        });
    }
});
