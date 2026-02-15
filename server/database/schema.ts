import { pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const rssFeeds = pgTable(
  "rss_feeds",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    link: text("link").notNull(),
    description: text("description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    linkUnique: unique().on(table.link),
  }),
);

export type RssFeedRow = typeof rssFeeds.$inferSelect;
export type NewRssFeedRow = typeof rssFeeds.$inferInsert;
