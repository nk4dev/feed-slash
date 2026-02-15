import { XMLParser } from "fast-xml-parser";
import DOMPurify from "isomorphic-dompurify";

export interface RssFeedItem {
  title: string;
  link: string;
  description: string | null;
  publishedAt: Date | null;
}

interface RdfItemNode {
  title?: string;
  link?: string;
  description?: string;
  "dc:date"?: string;
  "@_rdf:about"?: string;
}

interface RdfRootNode {
  item?: RdfItemNode | RdfItemNode[];
}

const rssXmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: false,
  trimValues: true,
  parseTagValue: true,
  processEntities: true,
});

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function parsePublishedAt(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function sanitizeDescription(value?: string): string | null {
  if (!value) {
    return null;
  }

  const sanitized = DOMPurify.sanitize(value, {
    USE_PROFILES: { html: true },
  }).trim();

  return sanitized || null;
}

function resolveRootNode(parsedXml: Record<string, unknown>): RdfRootNode {
  const rdfNode =
    (parsedXml["rdf:RDF"] as RdfRootNode | undefined) ||
    (parsedXml.RDF as RdfRootNode | undefined);

  if (!rdfNode) {
    throw new Error("Invalid RSS 1.0 RDF XML: missing rdf:RDF root node");
  }

  return rdfNode;
}

export function parseRssRdfXml(xml: string): RssFeedItem[] {
  const parsedXml = rssXmlParser.parse(xml) as Record<string, unknown>;
  const rootNode = resolveRootNode(parsedXml);

  return toArray(rootNode.item)
    .map((item): RssFeedItem | null => {
      const link = item.link || item["@_rdf:about"];
      if (!item.title || !link) {
        return null;
      }

      return {
        title: item.title,
        link,
        description: sanitizeDescription(item.description),
        publishedAt: parsePublishedAt(item["dc:date"]),
      };
    })
    .filter((item): item is RssFeedItem => Boolean(item));
}

export async function fetchAndParseRssFeed(
  feedUrl: string,
  timeoutMs = 8000,
): Promise<RssFeedItem[]> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(feedUrl, {
      signal: abortController.signal,
      headers: {
        Accept:
          "application/rdf+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch RSS feed: ${response.status} ${response.statusText}`,
      );
    }

    const xml = await response.text();
    return parseRssRdfXml(xml);
  } finally {
    clearTimeout(timeout);
  }
}
