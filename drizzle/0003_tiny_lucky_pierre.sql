CREATE TABLE "Bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"contentId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Bookmarks_userId_contentId_unique" UNIQUE("userId","contentId")
);
--> statement-breakpoint
CREATE TABLE "rss_feeds" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"link" text NOT NULL,
	"description" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rss_feeds_link_unique" UNIQUE("link")
);
--> statement-breakpoint
ALTER TABLE "FeedContent" DROP CONSTRAINT "FeedContent_contentUrl_unique";--> statement-breakpoint
ALTER TABLE "FeedMetaData" DROP CONSTRAINT "FeedMetaData_feedUrl_unique";--> statement-breakpoint
ALTER TABLE "FeedMetaData" ADD COLUMN "userId" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "Bookmarks" ADD CONSTRAINT "Bookmarks_contentId_FeedContent_contentId_fk" FOREIGN KEY ("contentId") REFERENCES "public"."FeedContent"("contentId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "FeedContent" ADD CONSTRAINT "FeedContent_parentId_contentUrl_unique" UNIQUE("parentId","contentUrl");--> statement-breakpoint
ALTER TABLE "FeedMetaData" ADD CONSTRAINT "FeedMetaData_userId_feedUrl_unique" UNIQUE("userId","feedUrl");