"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import {
  case_status,
  insertCaseStatusSchema,
  assets,
  projects,
} from "@/db/schema";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNull,
  isNotNull,
  or,
} from "drizzle-orm";
import { z } from "zod";

function sanitizeNullableId(value: unknown) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeCasePayload(body: Record<string, unknown>) {
  const payload = { ...body };

  if (payload.caseNo && !payload.case_no) {
    payload.case_no = payload.caseNo;
  }

  if (payload.case_no && typeof payload.case_no === "string") {
    payload.case_no = payload.case_no.trim();
  }

  if (payload.rtc && typeof payload.rtc === "string") {
    payload.rtc = payload.rtc.trim();
  }

  if (payload.judge && typeof payload.judge === "string") {
    payload.judge = payload.judge.trim();
  }

  return payload;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const assetId = searchParams.get("assetId");
    const projectId = searchParams.get("projectId");
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(parseInt(searchParams.get("limit") || "10", 10), 1);
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(case_status.case_no, term),
          ilike(case_status.rtc, term),
          ilike(case_status.judge, term),
          ilike(case_status.details, term),
        ),
      );
    }

    if (assetId && assetId.trim().length > 0) {
      const trimmed = assetId.trim().toLowerCase();
      if (trimmed === "unassigned") {
        conditions.push(isNull(case_status.assetId));
      } else if (trimmed === "assigned") {
        conditions.push(isNotNull(case_status.assetId));
      } else {
        conditions.push(eq(case_status.assetId, assetId.trim()));
      }
    }

    if (projectId && projectId.trim().length > 0) {
      const trimmed = projectId.trim().toLowerCase();
      if (trimmed === "unassigned") {
        conditions.push(isNull(case_status.projectId));
      } else if (trimmed === "assigned") {
        conditions.push(isNotNull(case_status.projectId));
      } else {
        conditions.push(eq(case_status.projectId, projectId.trim()));
      }
    }

    const query = db
      .select({
        caseRecord: case_status,
        asset: assets,
        project: projects,
      })
      .from(case_status)
      .leftJoin(assets, eq(case_status.assetId, assets.id))
      .leftJoin(projects, eq(case_status.projectId, projects.id))
      .orderBy(desc(case_status.lastUpdatedAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const casesResult = await query;

    const totalQuery = db
      .select({ count: count() })
      .from(case_status)
      .leftJoin(assets, eq(case_status.assetId, assets.id))
      .leftJoin(projects, eq(case_status.projectId, projects.id));

    if (conditions.length > 0) {
      totalQuery.where(
        conditions.length === 1 ? conditions[0] : and(...conditions),
      );
    }

    const [{ count: total }] = await totalQuery;

    const data = casesResult.map(({ caseRecord, asset, project }) => {
      const { case_no, ...rest } = caseRecord;
      return {
        ...rest,
        caseNo: case_no,
        asset: asset || null,
        project: project || null,
      };
    });

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
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch cases",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const payload = normalizeCasePayload(body);

    const parsed = {
      ...payload,
      assetId: sanitizeNullableId(body.assetId),
      projectId: sanitizeNullableId(body.projectId),
    };

    const validatedData = insertCaseStatusSchema.parse(parsed);

    const [newCase] = await db
      .insert(case_status)
      .values(validatedData)
      .returning();

    let associatedAsset = null;
    let associatedProject = null;

    if (newCase.assetId) {
      [associatedAsset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, newCase.assetId));
    }

    if (newCase.projectId) {
      [associatedProject] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, newCase.projectId));
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...(() => {
            const { case_no, ...rest } = newCase;
            return { ...rest, caseNo: case_no };
          })(),
          asset: associatedAsset || null,
          project: associatedProject || null,
        },
        message: "Case created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating case:", error);

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
      {
        success: false,
        error: "Failed to create case",
      },
      { status: 500 },
    );
  }
}
