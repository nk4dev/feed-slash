import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const feedMetaData = pgTable('FeedMetaData', {
  id: serial('id').primaryKey(),
  feedUrl: text('feedUrl').notNull().unique(),
  title: text('title'),
  remoteUrl: text('remote_url'),
  description: text('description'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const feedContent = pgTable('FeedContent', {
  contentId: serial('contentId').primaryKey(),
  parentId: integer('parentId').references(() => feedMetaData.id).notNull(),
  contentUrl: text('contentUrl').unique().notNull(),
  title: text('title'),
  content: text('content'),
  contentSnippet: text('contentSnippet'),
  author: text('author'),
  publishedAt: timestamp('publishedAt'),
});
