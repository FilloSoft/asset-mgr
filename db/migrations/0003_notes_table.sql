CREATE TABLE "notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "content" text NOT NULL,
  "asset_id" uuid,
  "project_id" uuid,
  "case_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes"
  ADD CONSTRAINT "notes_asset_id_assets_id_fk"
  FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notes"
  ADD CONSTRAINT "notes_project_id_projects_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notes"
  ADD CONSTRAINT "notes_case_id_cases_id_fk"
  FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "notes_asset_idx" ON "notes" USING btree ("asset_id");
--> statement-breakpoint
CREATE INDEX "notes_project_idx" ON "notes" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX "notes_case_idx" ON "notes" USING btree ("case_id");
--> statement-breakpoint
CREATE INDEX "notes_created_at_idx" ON "notes" USING btree ("created_at");
