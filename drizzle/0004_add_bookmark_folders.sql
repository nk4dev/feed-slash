CREATE TABLE "BookmarkFolders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "BookmarkFolders_userId_name_unique" UNIQUE("userId","name")
);
--> statement-breakpoint
ALTER TABLE "Bookmarks" ADD COLUMN "folderId" integer;
--> statement-breakpoint
ALTER TABLE "Bookmarks" ADD CONSTRAINT "Bookmarks_folderId_BookmarkFolders_id_fk" FOREIGN KEY ("folderId") REFERENCES "public"."BookmarkFolders"("id") ON DELETE set null ON UPDATE no action;
