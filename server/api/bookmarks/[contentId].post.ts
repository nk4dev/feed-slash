import { and, eq } from 'drizzle-orm';
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

        const contentId = parseInt(getRouterParam(event, 'contentId') || '');

        if (isNaN(contentId)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid content ID',
            });
        }

        // コンテンツがユーザーのフィードに属しているか確認
        const content = await db
            .select({ contentId: feedContent.contentId })
            .from(feedContent)
            .innerJoin(feedMetaData, eq(feedContent.parentId, feedMetaData.id))
            .where(
                and(
                    eq(feedContent.contentId, contentId),
                    eq(feedMetaData.userId, userId)
                )
            )
            .limit(1);

        if (content.length === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Content not found',
            });
        }

        // ブックマークを追加（既存の場合は無視）
        await db
            .insert(bookmarks)
            .values({
                userId,
                contentId,
            })
            .onConflictDoNothing();

        return { success: true, bookmarked: true };
    } catch (error: any) {
        console.error('[bookmarks.post] Error:', error);
        if (error?.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to add bookmark',
        });
    }
});
