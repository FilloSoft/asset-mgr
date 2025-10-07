CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "asset_projects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "asset_projects" CASCADE;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "tax_dec_no" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "declared_owner" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "market_value" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "assessed_value" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "car_status" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "asset_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "assigned_at" timestamp;--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_asset_idx" ON "projects" USING btree ("asset_id");--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "tax_dec_no";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "declared_owner";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "market_value";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "assessed_value";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "car_status";