export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const requestUrl = getRequestURL(event);

    const queryUrl = Array.isArray(query.url) ? query.url[0] : query.url;
    const emptyKeyUrl = requestUrl.searchParams.get('');
    const rawTarget = queryUrl || emptyKeyUrl;

    if (!rawTarget || typeof rawTarget !== 'string') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Missing redirect target',
        });
    }

    const decodedTarget = (() => {
        try {
            return decodeURIComponent(rawTarget);
        } catch {
            return rawTarget;
        }
    })();

    let resolvedTarget = decodedTarget.trim();
    if (!resolvedTarget) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid redirect target',
        });
    }

    if (/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#:]|$)/i.test(resolvedTarget)) {
        resolvedTarget = `https://${resolvedTarget}`;
    }

    let targetUrl: URL;
    try {
        targetUrl = new URL(resolvedTarget);
    } catch {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid redirect target URL',
        });
    }

    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Unsupported redirect protocol',
        });
    }

    return sendRedirect(event, targetUrl.toString(), 302);
});