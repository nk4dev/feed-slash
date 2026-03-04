import { createHash } from "node:crypto";

const TOKEN_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateApiToken(length = 40): string {
    let result = "";
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let index = 0; index < length; index += 1) {
        result += TOKEN_ALPHABET[bytes[index]! % TOKEN_ALPHABET.length];
    }
    return result;
}

export function hashApiToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export function getTokenPreview(token: string): string {
    return token.slice(0, 8);
}

export function parseTokenExpiry(body: { expiresAt?: string; ttlDays?: number } | null | undefined): Date | null {
    if (!body) return null;

    if (typeof body.expiresAt === "string" && body.expiresAt.trim().length > 0) {
        const parsed = new Date(body.expiresAt);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    if (typeof body.ttlDays === "number" && Number.isFinite(body.ttlDays) && body.ttlDays > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + Math.floor(body.ttlDays));
        return expiresAt;
    }

    return null;
}
