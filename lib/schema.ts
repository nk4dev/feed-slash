import { integer, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const feedMetaData = pgTable('FeedMetaData', {
  id: serial('id').primaryKey(),
  userId: text('userId').default('legacy').notNull(),
  feedUrl: text('feedUrl').notNull(),
  title: text('title'),
  remoteUrl: text('remote_url'),
  description: text('description'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => ({
  unq: unique().on(t.userId, t.feedUrl),
}));

export const feedContent = pgTable('FeedContent', {
  contentId: serial('contentId').primaryKey(),
  parentId: integer('parentId').references(() => feedMetaData.id).notNull(),
  contentUrl: text('contentUrl').notNull(),
  title: text('title'),
  content: text('content'),
  contentSnippet: text('contentSnippet'),
  author: text('author'),
  publishedAt: timestamp('publishedAt'),
}, (t) => ({
  unq: unique().on(t.parentId, t.contentUrl),
}));

export const bookmarks = pgTable('Bookmarks', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  contentId: integer('contentId').references(() => feedContent.contentId).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.userId, t.contentId),
}));
