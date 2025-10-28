CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rtc" text NOT NULL,
	"case_no" text NOT NULL,
	"last_updated_at" timestamp NOT NULL,
	"details" text,
	"judge" text,
	"asset_id" uuid,
	"project_id" uuid
);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "tax_declaration_no" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "tct_no" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "area_per_sq_m" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "location_of_property" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "barangay" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "bidder" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "auction_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "date_of_certification_of_sale" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "entry_no" text NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "details_short_update_log" text NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cases_rtc_idx" ON "cases" USING btree ("rtc");--> statement-breakpoint
CREATE INDEX "cases_case_no_idx" ON "cases" USING btree ("case_no");--> statement-breakpoint
CREATE INDEX "cases_judge_idx" ON "cases" USING btree ("judge");--> statement-breakpoint
CREATE INDEX "cases_asset_idx" ON "cases" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "cases_project_idx" ON "cases" USING btree ("project_id");
