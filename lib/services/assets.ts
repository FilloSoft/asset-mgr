import { and, count, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { assets, insertAssetSchema, projects, updateAssetSchema } from '@/db/schema';
import type { Asset, Project } from '@/db/schema';
import { db } from '@/lib/database';

import { HttpError } from './errors';
import { assertUuid, requireNonEmptyPayload } from './validation';

interface AssetFilters {
  status?: Asset['status'];
  search?: string | null;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

function buildAssetWhere(filters: AssetFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.status) {
    conditions.push(eq(assets.status, filters.status));
  }

  const searchTerm = filters.search?.trim();
  if (searchTerm) {
    const searchCondition = or(
      ilike(assets.name, `%${searchTerm}%`),
      ilike(assets.description, `%${searchTerm}%`),
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }


  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}

export async function listAssetsWithProjects(
  filters: AssetFilters,
  pagination: PaginationOptions,
): Promise<{ items: Array<Asset & { projects: Project[] }>; total: number }> {
  const whereExpression = buildAssetWhere(filters);
  const offset = (pagination.page - 1) * pagination.limit;

  const baseAssetsQuery = db.select().from(assets);
  const filteredAssetsQuery = whereExpression ? baseAssetsQuery.where(whereExpression) : baseAssetsQuery;

  const assetsResult = await filteredAssetsQuery
    .orderBy(desc(assets.createdAt))
    .limit(pagination.limit)
    .offset(offset);

  const assetIds = assetsResult.map((asset) => asset.id).filter(Boolean);
  const projectsByAsset = new Map<string, Project[]>();

  if (assetIds.length > 0) {
    const projectRows = await db
      .select()
      .from(projects)
      .where(inArray(projects.assetId, assetIds));

    for (const project of projectRows) {
      if (!project.assetId) {
        continue;
      }

      const bucket = projectsByAsset.get(project.assetId) ?? [];
      bucket.push(project as Project);
      projectsByAsset.set(project.assetId, bucket);
    }
  }

  const items = assetsResult.map((asset) => ({
    ...asset,
    projects: projectsByAsset.get(asset.id) ?? [],
  }));

  const baseTotalQuery = db.select({ total: count() }).from(assets);
  const totalQuery = whereExpression ? baseTotalQuery.where(whereExpression) : baseTotalQuery;
  const [{ total }] = await totalQuery;

  return { items, total };
}

export async function createAsset(payload: unknown) {
  const validatedData = insertAssetSchema.parse(payload);

  const [record] = await db
    .insert(assets)
    .values({
      ...validatedData,
      updatedAt: new Date(),
    })
    .returning();

  return record;
}

interface AssetUpdatePayload {
  id: string;
  [key: string]: unknown;
}

export async function bulkUpdateAssets(updates: unknown): Promise<Asset[]> {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new HttpError(400, 'Expected a non-empty array of assets');
  }

  return db.transaction(async (tx) => {
    const results: Asset[] = [];

    for (const entry of updates as AssetUpdatePayload[]) {
      const identifier = assertUuid(entry?.id, 'asset');
      const updatePayload = requireNonEmptyPayload(entry ?? {}, 'Asset update payload cannot be empty');
      const { id, ...rawData } = updatePayload;

      if (Object.keys(rawData).length === 0) {
        throw new HttpError(400, 'Asset update payload cannot be empty');
      }

      const validatedData = updateAssetSchema.parse(rawData);

      const [updated] = await tx
        .update(assets)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, identifier))
        .returning();

      if (!updated) {
        throw new HttpError(404, `Asset ${identifier} not found`);
      }

      results.push(updated);
    }

    return results;
  });
}

export async function bulkDeleteAssets(ids: string[]) {
  if (ids.length === 0) {
    throw new HttpError(400, 'Asset IDs are required');
  }

  return db.transaction(async (tx) => {
    await tx
      .update(projects)
      .set({ assetId: null, assignedAt: null })
      .where(inArray(projects.assetId, ids));

    return tx
      .delete(assets)
      .where(inArray(assets.id, ids))
      .returning();
  });
}
