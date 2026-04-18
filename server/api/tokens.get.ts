import { desc, eq } from 'drizzle-orm';
import { db } from '~~/lib/db';
import { apiTokens } from '~~/lib/schema';
import { getTokenPreview } from '~~/server/utils/apiToken';

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
            tokenPrefix: apiTokens.tokenPrefix,
            label: apiTokens.label,
            createdAt: apiTokens.createdAt,
            expiresAt: apiTokens.expiresAt,
            lastUsedAt: apiTokens.lastUsedAt,
        })
        .from(apiTokens)
        .where(eq(apiTokens.userId, userId))
        .orderBy(desc(apiTokens.createdAt));

    return rows.map((r) => ({
        id: r.id,
        label: r.label,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        lastUsedAt: r.lastUsedAt,
        tokenPreview: (r.tokenPrefix || (r.token ? getTokenPreview(r.token) : '')) + '***',
    }));
});
