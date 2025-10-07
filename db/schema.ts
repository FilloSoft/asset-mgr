import { pgTable, uuid, text, timestamp, index, primaryKey, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';

// Assets table
export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  taxDecNo: text('tax_dec_no').notNull(),
  declaredOwner: text('declared_owner').notNull(),
  marketValue: text('market_value').notNull(),
  assessedValue: text('assessed_value').notNull(),
  carStatus: text('car_status'),
  location: jsonb('location').$type<{
    lat: number;
    lng: number;
  }>().notNull(),
  status: text('status', { 
    enum: ['active', 'inactive', 'maintenance', 'retired'] 
  }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('assets_name_idx').on(table.name),
  statusIdx: index('assets_status_idx').on(table.status),
  createdAtIdx: index('assets_created_at_idx').on(table.createdAt),
}));

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', {
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled']
  }).notNull().default('planning'),
  assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'set null' }),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  assignedAt: timestamp('assigned_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('projects_name_idx').on(table.name),
  statusIdx: index('projects_status_idx').on(table.status),
  assetIdx: index('projects_asset_idx').on(table.assetId),
  createdAtIdx: index('projects_created_at_idx').on(table.createdAt),
}));

// Define relationships
export const assetsRelations = relations(assets, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  asset: one(assets, {
    fields: [projects.assetId],
    references: [assets.id],
  }),
}));

// Zod schemas for validation

// Asset schemas
export const insertAssetSchema = createInsertSchema(assets, {
  name: z.string().min(1, 'Asset name is required').trim(),
  description: z.string().min(1, 'Asset description is required').trim(),
  location: z.object({
    lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
    lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  }),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired']).default('active'),
});

export const selectAssetSchema = createSelectSchema(assets);
export const updateAssetSchema = insertAssetSchema.partial().omit({ id: true, createdAt: true });

// Project schemas
export const insertProjectSchema = createInsertSchema(projects, {
  name: z.string().min(1, 'Project name is required').trim(),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']).default('planning'),
  assetId: z.string().uuid('Invalid asset ID').optional(),
  startDate: z.union([
    z.string().datetime('Invalid date format').transform(str => new Date(str)),
    z.date(),
    z.null()
  ]).optional(),
  endDate: z.union([
    z.string().datetime('Invalid date format').transform(str => new Date(str)),
    z.date(),
    z.null()
  ]).optional(),
  assignedAt: z.union([
    z.string().datetime('Invalid date format').transform(str => new Date(str)),
    z.date(),
    z.null()
  ]).optional(),
});

export const selectProjectSchema = createSelectSchema(projects);
export const updateProjectSchema = insertProjectSchema.partial().omit({ id: true, createdAt: true });

// TypeScript types
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;