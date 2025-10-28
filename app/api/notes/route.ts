"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import {
  notes,
  assets,
  projects,
  case_status,
  insertNoteSchema,
} from "@/db/schema";
import { and, count, desc, eq, ilike, isNull } from "drizzle-orm";
import { z } from "zod";

function sanitizeNullableId(value: unknown) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const payload = { ...body };

  if (payload.content && typeof payload.content === "string") {
    payload.content = payload.content.trim();
  }

  if (payload.assetId) {
    payload.assetId = sanitizeNullableId(payload.assetId);
  }
  if (payload.projectId) {
    payload.projectId = sanitizeNullableId(payload.projectId);
  }
  if (payload.caseId) {
    payload.caseId = sanitizeNullableId(payload.caseId);
  }

  return payload;
}

function toCamelCaseNote({
  note,
  asset,
  project,
  caseRecord,
}: {
  note: typeof notes.$inferSelect;
  asset: typeof assets.$inferSelect | null;
  project: typeof projects.$inferSelect | null;
  caseRecord: typeof case_status.$inferSelect | null;
}) {
  const { content, assetId, projectId, caseId, createdAt, updatedAt, ...rest } =
    note;

  return {
    ...rest,
    content,
    assetId,
    projectId,
    caseId,
    createdAt,
    updatedAt,
    asset: asset
      ? {
          id: asset.id,
          name: asset.name,
          status: asset.status,
        }
      : null,
    project: project
      ? {
          id: project.id,
          name: project.name,
          status: project.status,
        }
      : null,
    case: caseRecord
      ? {
          id: caseRecord.id,
          caseNo: caseRecord.case_no,
          rtc: caseRecord.rtc,
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const assetId = searchParams.get("assetId");
    const projectId = searchParams.get("projectId");
    const caseId = searchParams.get("caseId");
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10", 10), 1);
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      conditions.push(ilike(notes.content, term));
    }

    if (assetId && assetId.trim().length > 0) {
      const trimmed = assetId.trim();
      const normalized = trimmed.toLowerCase();
      if (normalized === "unassigned") {
        conditions.push(isNull(notes.assetId));
      } else {
        conditions.push(eq(notes.assetId, trimmed));
      }
    }

    if (projectId && projectId.trim().length > 0) {
      const trimmed = projectId.trim();
      const normalized = trimmed.toLowerCase();
      if (normalized === "unassigned") {
        conditions.push(isNull(notes.projectId));
      } else {
        conditions.push(eq(notes.projectId, trimmed));
      }
    }

    if (caseId && caseId.trim().length > 0) {
      const trimmed = caseId.trim();
      const normalized = trimmed.toLowerCase();
      if (normalized === "unassigned") {
        conditions.push(isNull(notes.caseId));
      } else {
        conditions.push(eq(notes.caseId, trimmed));
      }
    }

    const query = db
      .select({
        note: notes,
        asset: assets,
        project: projects,
        caseRecord: case_status,
      })
      .from(notes)
      .leftJoin(assets, eq(notes.assetId, assets.id))
      .leftJoin(projects, eq(notes.projectId, projects.id))
      .leftJoin(case_status, eq(notes.caseId, case_status.id))
      .orderBy(desc(notes.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const notesResult = await query;

    const totalQuery = db.select({ count: count() }).from(notes);

    if (conditions.length > 0) {
      totalQuery.where(
        conditions.length === 1 ? conditions[0] : and(...conditions),
      );
    }

    const [{ count: total }] = await totalQuery;

    const data = notesResult.map(toCamelCaseNote);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = normalizeBody(body);

    const validatedData = insertNoteSchema.parse(payload);

    const [newNote] = await db.insert(notes).values(validatedData).returning();

    const [fullNote] = await db
      .select({
        note: notes,
        asset: assets,
        project: projects,
        caseRecord: case_status,
      })
      .from(notes)
      .leftJoin(assets, eq(notes.assetId, assets.id))
      .leftJoin(projects, eq(notes.projectId, projects.id))
      .leftJoin(case_status, eq(notes.caseId, case_status.id))
      .where(eq(notes.id, newNote.id));

    return NextResponse.json(
      {
        success: true,
        data: toCamelCaseNote(fullNote),
        message: "Note created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating note:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create note" },
      { status: 500 },
    );
  }
}
