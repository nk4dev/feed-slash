CREATE TABLE IF NOT EXISTS "ApiTokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text,
	"label" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ApiTokens" ADD COLUMN IF NOT EXISTS "tokenHash" text;
--> statement-breakpoint
ALTER TABLE "ApiTokens" ADD COLUMN IF NOT EXISTS "tokenPrefix" text;
--> statement-breakpoint
ALTER TABLE "ApiTokens" ADD COLUMN IF NOT EXISTS "expiresAt" timestamp;
--> statement-breakpoint
ALTER TABLE "ApiTokens" ADD COLUMN IF NOT EXISTS "lastUsedAt" timestamp;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ApiTokens_token_unique" ON "ApiTokens" USING btree ("token");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ApiTokens_tokenHash_unique" ON "ApiTokens" USING btree ("tokenHash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ApiTokens_userId_createdAt_idx" ON "ApiTokens" USING btree ("userId", "createdAt");