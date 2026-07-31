CREATE TABLE "premium_entitlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"productId" varchar(64) NOT NULL,
	"platform" text NOT NULL,
	"rcAppUserId" varchar(64) NOT NULL,
	"currentPeriodEnd" timestamp NOT NULL,
	"willRenew" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "premium_entitlements_userId_uidx" ON "premium_entitlements" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "premium_entitlements_rcAppUserId_idx" ON "premium_entitlements" USING btree ("rcAppUserId");--> statement-breakpoint
CREATE INDEX "premium_entitlements_currentPeriodEnd_idx" ON "premium_entitlements" USING btree ("currentPeriodEnd");