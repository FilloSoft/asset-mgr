import { and, count, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { case_status, insertCaseStatusSchema, updateCaseStatusSchema } from '@/db/schema';
import type { CaseStatus } from '@/db/schema';
import { db } from '@/lib/database';

import { HttpError } from './errors';
import { assertUuid, requireNonEmptyPayload } from './validation';

interface CaseStatusFilters {
  rtc?: string | null;
  judge?: string | null;
  caseNo?: string | null;
  search?: string | null;
}

interface PaginationOptions {
  page: number;
  limit: number;
}

function buildCaseStatusWhere(filters: CaseStatusFilters): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.rtc) {
    conditions.push(eq(case_status.rtc, filters.rtc));
  }

  if (filters.judge) {
    conditions.push(eq(case_status.judge, filters.judge));
  }

  if (filters.caseNo) {
    conditions.push(eq(case_status.case_no, filters.caseNo));
  }

  const searchTerm = filters.search?.trim();
  if (searchTerm) {
    const searchCondition = or(
      ilike(case_status.rtc, `%${searchTerm}%`),
      ilike(case_status.case_no, `%${searchTerm}%`),
      ilike(case_status.details, `%${searchTerm}%`),
      ilike(case_status.judge, `%${searchTerm}%`),
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

export async function listCaseStatuses(
  filters: CaseStatusFilters,
  pagination: PaginationOptions,
): Promise<{ items: CaseStatus[]; total: number }> {
  const whereExpression = buildCaseStatusWhere(filters);
  const offset = (pagination.page - 1) * pagination.limit;

  const baseQuery = db.select().from(case_status);
  const filteredQuery = whereExpression ? baseQuery.where(whereExpression) : baseQuery;

  const items = await filteredQuery
    .orderBy(desc(case_status.lastUpdatedAt))
    .limit(pagination.limit)
    .offset(offset);

  const totalRows = await (whereExpression
    ? db.select({ total: count() }).from(case_status).where(whereExpression)
    : db.select({ total: count() }).from(case_status));

  const [{ total }] = totalRows;

  return { items, total };
}

function ensurePayloadWithTimestamp(payload: unknown, fallback: Date): unknown {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    if (!record.lastUpdatedAt) {
      return { ...record, lastUpdatedAt: fallback };
    }
  }

  return payload;
}

export async function createCaseStatus(payload: unknown): Promise<CaseStatus> {
  const enrichedPayload = ensurePayloadWithTimestamp(payload, new Date());
  const validatedData = insertCaseStatusSchema.parse(enrichedPayload);

  const [record] = await db
    .insert(case_status)
    .values({
      ...validatedData,
      lastUpdatedAt: validatedData.lastUpdatedAt ?? new Date(),
    })
    .returning();

  return record;
}

export async function getCaseStatusById(id: string): Promise<CaseStatus | null> {
  const identifier = assertUuid(id, 'case status');

  const [record] = await db
    .select()
    .from(case_status)
    .where(eq(case_status.id, identifier))
    .limit(1);

  return record ?? null;
}

export async function updateCaseStatus(id: string, payload: unknown): Promise<CaseStatus> {
  const identifier = assertUuid(id, 'case status');
  const validatedPayload = requireNonEmptyPayload(
    payload as Record<string, unknown>,
    'Case status update payload cannot be empty',
  );

  const validatedData = updateCaseStatusSchema.parse(validatedPayload);
  const updateData = {
    ...validatedData,
    lastUpdatedAt: validatedData.lastUpdatedAt ?? new Date(),
  };

  const [updated] = await db
    .update(case_status)
    .set(updateData)
    .where(eq(case_status.id, identifier))
    .returning();

  if (!updated) {
    throw new HttpError(404, `Case status ${identifier} not found`);
  }

  return updated;
}

export async function deleteCaseStatus(id: string): Promise<CaseStatus> {
  const identifier = assertUuid(id, 'case status');

  const [deleted] = await db
    .delete(case_status)
    .where(eq(case_status.id, identifier))
    .returning();

  if (!deleted) {
    throw new HttpError(404, `Case status ${identifier} not found`);
  }

  return deleted;
}

export async function bulkDeleteCaseStatuses(ids: string[]): Promise<CaseStatus[]> {
  if (ids.length === 0) {
    throw new HttpError(400, 'Case status IDs are required');
  }

  ids.forEach((value) => {
    assertUuid(value, 'case status');
  });

  return db
    .delete(case_status)
    .where(inArray(case_status.id, ids))
    .returning();
}

