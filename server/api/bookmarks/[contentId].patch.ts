import { and, eq } from 'drizzle-orm';
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

        const contentId = parseInt(getRouterParam(event, 'contentId') || '');

        if (isNaN(contentId)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid content ID',
            });
        }

        const body = await readBody<{ folderId: number | null }>(event);

        // folderId が null の場合はフォルダから解除
        if (body.folderId !== null) {
            // フォルダが存在し、ユーザーのものであるか確認
            const folder = await db
                .select({ id: bookmarkFolders.id })
                .from(bookmarkFolders)
                .where(
                    and(
                        eq(bookmarkFolders.id, body.folderId),
                        eq(bookmarkFolders.userId, userId)
                    )
                )
                .limit(1);

            if (folder.length === 0) {
                throw createError({
                    statusCode: 404,
                    statusMessage: 'Folder not found',
                });
            }
        }

        const result = await db
            .update(bookmarks)
            .set({ folderId: body.folderId })
            .where(
                and(
                    eq(bookmarks.userId, userId),
                    eq(bookmarks.contentId, contentId)
                )
            )
            .returning();

        if (result.length === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Bookmark not found',
            });
        }

        return { success: true, folderId: body.folderId };
    } catch (error: any) {
        console.error('[bookmark-move.patch] Error:', error);
        if (error?.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to move bookmark',
        });
    }
});
