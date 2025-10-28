import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

function coerceTimestamp(fieldLabel: string) {
  return z.preprocess((value) => {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (trimmed.length === 0) {
        return undefined;
      }

      const parsed = new Date(trimmed);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }

      return value;
    }

    if (typeof value === "number") {
      const parsed = new Date(value);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }

      return value;
    }

    return value;
  }, z.date({}));
}

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  }),
);

// Assets table
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    taxDecNo: text("tax_dec_no").notNull(),
    declaredOwner: text("declared_owner").notNull(),
    marketValue: text("market_value").notNull(),
    assessedValue: text("assessed_value").notNull(),
    carStatus: text("car_status"),
    location: jsonb("location")
      .$type<{
        lat: number;
        lng: number;
      }>()
      .notNull(),
    status: text("status", {
      enum: ["active", "inactive", "maintenance", "retired"],
    })
      .notNull()
      .default("active"),
    address: text("address").notNull(),
    taxDeclarationNo: text("tax_declaration_no").notNull(),
    tctNo: text("tct_no").notNull(),
    areaPerSqM: text("area_per_sq_m").notNull(),
    locationOfPropery: text("location_of_property").notNull(),
    barangay: text("barangay").notNull(),
    bidder: text("bidder").notNull(),
    auctionDate: timestamp("auction_date").notNull(),
    dateOfCertificationOfSale: timestamp(
      "date_of_certification_of_sale",
    ).notNull(),
    entryNo: text("entry_no").notNull(),
    detailsShortUpdateLog: text("details_short_update_log").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("assets_name_idx").on(table.name),
    index("assets_status_idx").on(table.status),
    index("assets_created_at_idx").on(table.createdAt),
  ],
);

// Projects table
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status", {
      enum: ["planning", "active", "on-hold", "completed", "cancelled"],
    })
      .notNull()
      .default("planning"),
    assetId: uuid("asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    assignedAt: timestamp("assigned_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("projects_name_idx").on(table.name),
    index("projects_status_idx").on(table.status),
    index("projects_asset_idx").on(table.assetId),
    index("projects_created_at_idx").on(table.createdAt),
  ],
);

export const case_status = pgTable(
  "cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    rtc: text("rtc").notNull(),
    case_no: text("case_no").notNull(),
    lastUpdatedAt: timestamp("last_updated_at").notNull(),
    details: text("details"),
    judge: text("judge"),
    assetId: uuid("asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("cases_rtc_idx").on(table.rtc),
    index("cases_case_no_idx").on(table.case_no),
    index("cases_judge_idx").on(table.judge),
    index("cases_asset_idx").on(table.assetId),
    index("cases_project_idx").on(table.projectId),
  ],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    assetId: uuid("asset_id").references(() => assets.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    caseId: uuid("case_id").references(() => case_status.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("notes_asset_idx").on(table.assetId),
    index("notes_project_idx").on(table.projectId),
    index("notes_case_idx").on(table.caseId),
    index("notes_created_at_idx").on(table.createdAt),
  ],
);

// Define relationships
export const assetsRelations = relations(assets, ({ many }) => ({
  projects: many(projects),
  cases: many(case_status),
  notes: many(notes),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  asset: one(assets, {
    fields: [projects.assetId],
    references: [assets.id],
  }),
  cases: many(case_status),
  notes: many(notes),
}));

export const caseStatusRelations = relations(case_status, ({ one, many }) => ({
  asset: one(assets, {
    fields: [case_status.assetId],
    references: [assets.id],
  }),
  project: one(projects, {
    fields: [case_status.projectId],
    references: [projects.id],
  }),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  asset: one(assets, {
    fields: [notes.assetId],
    references: [assets.id],
  }),
  project: one(projects, {
    fields: [notes.projectId],
    references: [projects.id],
  }),
  case: one(case_status, {
    fields: [notes.caseId],
    references: [case_status.id],
  }),
}));

// Zod schemas for validation

// Asset schemas
export const insertAssetSchema = createInsertSchema(assets, {
  name: z.string().min(1, "Asset name is required").trim(),
  description: z.string().min(1, "Asset description is required").trim(),
  location: z.object({
    lat: z
      .number()
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90"),
    lng: z
      .number()
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),
  }),
  auctionDate: coerceTimestamp("Auction date"),
  dateOfCertificationOfSale: coerceTimestamp("Certification of sale date"),
  status: z
    .enum(["active", "inactive", "maintenance", "retired"])
    .default("active"),
});

export const selectAssetSchema = createSelectSchema(assets);
export const updateAssetSchema = insertAssetSchema
  .partial()
  .omit({ id: true, createdAt: true });

// Project schemas
export const insertProjectSchema = createInsertSchema(projects, {
  name: z.string().min(1, "Project name is required").trim(),
  description: z.string().optional(),
  status: z
    .enum(["planning", "active", "on-hold", "completed", "cancelled"])
    .default("planning"),
  assetId: z.union([z.string().uuid("Invalid asset ID"), z.null()]).optional(),
  startDate: z
    .union([
      z
        .string()
        .datetime("Invalid date format")
        .transform((str) => new Date(str)),
      z.date(),
      z.null(),
    ])
    .optional(),
  endDate: z
    .union([
      z
        .string()
        .datetime("Invalid date format")
        .transform((str) => new Date(str)),
      z.date(),
      z.null(),
    ])
    .optional(),
  assignedAt: z
    .union([
      z
        .string()
        .datetime("Invalid date format")
        .transform((str) => new Date(str)),
      z.date(),
      z.null(),
    ])
    .optional(),
});

export const selectProjectSchema = createSelectSchema(projects);
export const updateProjectSchema = insertProjectSchema
  .partial()
  .omit({ id: true, createdAt: true });

// Case status schemas
export const insertCaseStatusSchema = createInsertSchema(case_status, {
  rtc: z.string().min(1, "RTC is required").trim(),
  case_no: z.string().min(1, "Case number is required").trim(),
  lastUpdatedAt: coerceTimestamp("Last updated at"),
  details: z.string().optional(),
  judge: z.string().optional(),
});

export const selectCaseStatusSchema = createSelectSchema(case_status);
export const updateCaseStatusSchema = insertCaseStatusSchema
  .partial()
  .omit({ id: true });

const baseInsertNoteSchema = createInsertSchema(notes, {
  content: z.string().min(1, "Note content is required").trim(),
  assetId: z.string().uuid("Invalid asset ID").optional().nullable(),
  projectId: z.string().uuid("Invalid project ID").optional().nullable(),
  caseId: z.string().uuid("Invalid case ID").optional().nullable(),
});

export const insertNoteSchema = baseInsertNoteSchema.refine(
  (data) => data.assetId || data.projectId || data.caseId,
  {
    message: "A note must be linked to an asset, project, or case",
    path: ["assetId"],
  },
);

export const selectNoteSchema = createSelectSchema(notes);
export const updateNoteSchema = insertNoteSchema
  .partial()
  .omit({ id: true, createdAt: true });

// User schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").trim(),
});

export const selectUserSchema = createSelectSchema(users);
export const updateUserSchema = insertUserSchema
  .partial()
  .omit({ id: true, createdAt: true, password: true });
export const loginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// TypeScript types
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type CaseStatus = typeof case_status.$inferSelect;
export type NewCaseStatus = typeof case_status.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
