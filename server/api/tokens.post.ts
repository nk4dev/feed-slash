import { db } from '~~/lib/db';
import { apiTokens } from '~~/lib/schema';

function generateToken(length: number): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i]! % chars.length];
    }
    return result;
}

export default defineEventHandler(async (event) => {
    const auth = await event.context.auth();
    const { userId } = auth || {};
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const body = await readBody(event).catch(() => ({}));
    const label = body?.label as string | undefined;
    const token = generateToken(30);

    const [row] = await db.insert(apiTokens).values({ userId, token, label }).returning();

    return { id: row!.id, token: row!.token, label: row!.label, createdAt: row!.createdAt };
});
