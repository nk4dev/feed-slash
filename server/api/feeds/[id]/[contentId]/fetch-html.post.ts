import { db } from '~~/lib/db';
import { feedContent } from '~~/lib/schema';
import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const idParam = event.context.params?.id;
  const contentIdParam = event.context.params?.contentId;

  const id = Number(idParam);
  const contentId = Number(contentIdParam);

  if (!idParam || Number.isNaN(id) || !contentIdParam || Number.isNaN(contentId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid feed or content id',
    });
  }

  try {
    // Get the content item
    const [item] = await db
      .select()
      .from(feedContent)
      .where(and(eq(feedContent.parentId, id), eq(feedContent.contentId, contentId)))
      .limit(1);

    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Content not found',
      });
    }

    // Fetch HTML from the original URL
    const response = await fetch(item.contentUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NuxtFeedReader/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw createError({
        statusCode: 400,
        statusMessage: `Failed to fetch content (HTTP ${response.status})`,
      });
    }

    const html = await response.text();

    // Extract main content from HTML
    const extractedContent = extractMainContent(html);

    // Update the database with fetched content
    const [updated] = await db
      .update(feedContent)
      .set({
        content: extractedContent,
      })
      .where(and(eq(feedContent.parentId, id), eq(feedContent.contentId, contentId)))
      .returning();

    return {
      success: true,
      item: updated,
      contentLength: extractedContent.length,
    };
  } catch (error: any) {
    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch HTML content',
      data: error.message,
    });
  }
});

/**
 * Extract main content from HTML
 * Attempts to find article/main content and remove navigation, ads, etc.
 */
function extractMainContent(html: string): string {
  // Remove script and style tags
  let content = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

  // Try to find article or main content
  const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    return articleMatch[0];
  }

  const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    return mainMatch[0];
  }

  // Look for common content container classes
  const contentPatterns = [
    /<div[^>]*class="[^"]*(?:article|post|entry|content|main)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*(?:article|post|entry|content)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
  ];

  for (const pattern of contentPatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[0];
    }
  }

  // Fallback: get body content
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    // Remove header, footer, nav, aside
    return bodyMatch[1]
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '');
  }

  return content;
}
