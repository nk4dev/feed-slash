CREATE TABLE "FeedContent" (
	"contentId" serial PRIMARY KEY NOT NULL,
	"parentId" integer NOT NULL,
	"contentUrl" text NOT NULL,
	"title" text,
	CONSTRAINT "FeedContent_contentUrl_unique" UNIQUE("contentUrl")
);
--> statement-breakpoint
CREATE TABLE "FeedMetaData" (
	"id" serial PRIMARY KEY NOT NULL,
	"feedUrl" text NOT NULL,
	"title" text,
	"remote_url" text,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "FeedMetaData_feedUrl_unique" UNIQUE("feedUrl")
);
--> statement-breakpoint
ALTER TABLE "FeedContent" ADD CONSTRAINT "FeedContent_parentId_FeedMetaData_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."FeedMetaData"("id") ON DELETE no action ON UPDATE no action;