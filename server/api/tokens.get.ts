import { desc, eq } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { apiTokens } from '~~/lib/schema';

export default defineEventHandler(async (event) => {
    const auth = await event.context.auth();
    const { userId } = auth || {};
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const rows = await db
        .select({
            id: apiTokens.id,
            token: apiTokens.token,
            label: apiTokens.label,
            createdAt: apiTokens.createdAt,
        })
        .from(apiTokens)
        .where(eq(apiTokens.userId, userId))
        .orderBy(desc(apiTokens.createdAt));

    // Mask token: show first 6 chars + ***
    return rows.map((r) => ({
        ...r,
        token: r.token.slice(0, 6) + '***',
    }));
});
