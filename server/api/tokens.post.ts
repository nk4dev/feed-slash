import { db } from '~~/lib/db';
import { apiTokens } from '~~/lib/schema';
import { generateApiToken, getTokenPreview, hashApiToken, parseTokenExpiry } from '~~/server/utils/apiToken';

export default defineEventHandler(async (event) => {
    const auth = await event.context.auth();
    const { userId } = auth || {};
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const body = await readBody<{ label?: string; expiresAt?: string; ttlDays?: number }>(event).catch(() => ({}));
    const label = typeof body?.label === 'string' && body.label.trim().length > 0 ? body.label.trim() : undefined;
    const token = generateApiToken(40);
    const tokenHash = hashApiToken(token);
    const tokenPrefix = getTokenPreview(token);
    const expiresAt = parseTokenExpiry(body);

    const [row] = await db
        .insert(apiTokens)
        .values({ userId, tokenHash, tokenPrefix, label, expiresAt })
        .returning();

    return {
        id: row!.id,
        token,
        tokenPreview: row!.tokenPrefix,
        label: row!.label,
        createdAt: row!.createdAt,
        expiresAt: row!.expiresAt,
        lastUsedAt: row!.lastUsedAt,
    };
});
