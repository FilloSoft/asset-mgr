import { and, count, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { assets, projects, insertProjectSchema, updateProjectSchema } from '@/db/schema';
import type { Project } from '@/db/schema';
import { db } from '@/lib/database';

import { HttpError } from './errors';
import { assertUuid, requireNonEmptyPayload } from './validation';

interface ProjectFilters {
  status?: Project['status'];
  search?: string | null;
  assetId?: string | null;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

function buildProjectWhere(filters: ProjectFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.status) {
    conditions.push(eq(projects.status, filters.status));
  }

  if (filters.assetId) {
    conditions.push(eq(projects.assetId, filters.assetId));
  }


  const searchTerm = filters.search?.trim();
  if (searchTerm) {
    const searchCondition = or(
      ilike(projects.name, `%${searchTerm}%`),
      ilike(projects.description, `%${searchTerm}%`),
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

export async function listProjects(
  filters: ProjectFilters,
  pagination: PaginationOptions,
): Promise<{ items: Array<Project & { asset: typeof assets.$inferSelect | null }>; total: number }> {
  const whereExpression = buildProjectWhere(filters);
  const offset = (pagination.page - 1) * pagination.limit;

  const baseProjectsQuery = db
    .select({
      project: projects,
      asset: assets,
    })
    .from(projects)
    .leftJoin(assets, eq(projects.assetId, assets.id));

  const filteredProjectsQuery = whereExpression
    ? baseProjectsQuery.where(whereExpression)
    : baseProjectsQuery;

  const projectsResult = await filteredProjectsQuery
    .orderBy(desc(projects.createdAt))
    .limit(pagination.limit)
    .offset(offset);

  const items = projectsResult.map(({ project, asset }) => ({
    ...project,
    asset: asset ?? null,
  }));

  const baseTotalQuery = db.select({ total: count() }).from(projects);
  const totalQuery = whereExpression ? baseTotalQuery.where(whereExpression) : baseTotalQuery;
  const [{ total }] = await totalQuery;

  return { items, total };
}

export async function createProject(payload: unknown) {
  const validatedData = insertProjectSchema.parse(payload);

  const projectData = {
    ...validatedData,
    assignedAt: validatedData.assetId ? new Date() : null,
    updatedAt: new Date(),
  };

  const [newProject] = await db
    .insert(projects)
    .values(projectData)
    .returning();

  let associatedAsset: typeof assets.$inferSelect | null = null;
  if (newProject.assetId) {
    [associatedAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, newProject.assetId));
  }

  return {
    ...newProject,
    asset: associatedAsset ?? null,
  };
}

interface ProjectUpdatePayload {
  id: string;
  [key: string]: unknown;
}

export async function bulkUpdateProjects(updates: unknown) {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new HttpError(400, 'Expected a non-empty array of projects');
  }

  return db.transaction(async (tx) => {
    const results: Array<Project & { asset: typeof assets.$inferSelect | null }> = [];

    for (const entry of updates as ProjectUpdatePayload[]) {
      const identifier = assertUuid(entry?.id, 'project');
      const updatePayload = requireNonEmptyPayload(entry ?? {}, 'Project update payload cannot be empty');
      const { id, ...rawData } = updatePayload;

      if (Object.keys(rawData).length === 0) {
        throw new HttpError(400, 'Project update payload cannot be empty');
      }

      const validatedData = updateProjectSchema.parse(rawData);

      const projectUpdateData = {
        ...validatedData,
        assignedAt: validatedData.assetId ? new Date() : null,
        updatedAt: new Date(),
      };

      const [updatedProject] = await tx
        .update(projects)
        .set(projectUpdateData)
        .where(eq(projects.id, identifier))
        .returning();

      if (!updatedProject) {
        throw new HttpError(404, `Project ${identifier} not found`);
      }

      let associatedAsset: typeof assets.$inferSelect | null = null;
      if (updatedProject.assetId) {
        [associatedAsset] = await tx
          .select()
          .from(assets)
          .where(eq(assets.id, updatedProject.assetId));
      }

      results.push({
        ...updatedProject,
        asset: associatedAsset ?? null,
      });
    }

    return results;
  });
}

export async function bulkDeleteProjects(ids: string[]) {
  if (ids.length === 0) {
    throw new HttpError(400, 'Project IDs are required');
  }

  return db
    .delete(projects)
    .where(inArray(projects.id, ids))
    .returning();
}
