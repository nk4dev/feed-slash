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

        const body = await readBody<{ name: string }>(event);

        if (!body?.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Folder name is required',
            });
        }

        const name = body.name.trim();

        if (name.length > 50) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Folder name must be 50 characters or less',
            });
        }

        const [folder] = await db
            .insert(bookmarkFolders)
            .values({
                userId,
                name,
            })
            .onConflictDoNothing()
            .returning();

        if (!folder) {
            throw createError({
                statusCode: 409,
                statusMessage: 'A folder with this name already exists',
            });
        }

        return folder;
    } catch (error: any) {
        console.error('[bookmark-folders.post] Error:', error);
        if (error?.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to create bookmark folder',
        });
    }
});
