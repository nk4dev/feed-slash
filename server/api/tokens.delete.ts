import { and, eq } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { apiTokens } from '~~/lib/schema';

export default defineEventHandler(async (event) => {
    const auth = await event.context.auth();
    const { userId } = auth || {};
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const body = await readBody(event);
    const id = Number(body?.id);
    if (!id || Number.isNaN(id)) {
        throw createError({ statusCode: 400, statusMessage: 'Missing or invalid id' });
    }

    const deleted = await db
        .delete(apiTokens)
        .where(and(eq(apiTokens.id, id), eq(apiTokens.userId, userId)))
        .returning();

    if (!deleted.length) {
        throw createError({ statusCode: 404, statusMessage: 'Token not found' });
    }

    return { success: true };
});
