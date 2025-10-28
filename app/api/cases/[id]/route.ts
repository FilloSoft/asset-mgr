"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import {
  case_status,
  updateCaseStatusSchema,
  assets,
  projects,
} from "@/db/schema";
import { eq } from "drizzle-orm";
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

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid case ID format",
        },
        { status: 400 },
      );
    }

    const results = await db
      .select({
        caseRecord: case_status,
        asset: assets,
        project: projects,
      })
      .from(case_status)
      .leftJoin(assets, eq(case_status.assetId, assets.id))
      .leftJoin(projects, eq(case_status.projectId, projects.id))
      .where(eq(case_status.id, id));

    if (results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Case not found",
        },
        { status: 404 },
      );
    }

    const { caseRecord, asset, project } = results[0];

    const { case_no, ...rest } = caseRecord;

    return NextResponse.json({
      success: true,
      data: {
        ...rest,
        caseNo: case_no,
        asset: asset || null,
        project: project || null,
      },
    });
  } catch (error) {
    console.error("Error fetching case:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch case",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid case ID format",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const normalized = normalizeCasePayload(body);

    const payload = {
      ...normalized,
      assetId: sanitizeNullableId(body.assetId),
      projectId: sanitizeNullableId(body.projectId),
    };

    const validatedData = updateCaseStatusSchema.parse(payload);

    const [updatedCase] = await db
      .update(case_status)
      .set(validatedData)
      .where(eq(case_status.id, id))
      .returning();

    if (!updatedCase) {
      return NextResponse.json(
        {
          success: false,
          error: "Case not found",
        },
        { status: 404 },
      );
    }

    let associatedAsset = null;
    let associatedProject = null;

    if (updatedCase.assetId) {
      [associatedAsset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, updatedCase.assetId));
    }

    if (updatedCase.projectId) {
      [associatedProject] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, updatedCase.projectId));
    }

    const { case_no, ...rest } = updatedCase;

    return NextResponse.json({
      success: true,
      data: {
        ...rest,
        caseNo: case_no,
        asset: associatedAsset || null,
        project: associatedProject || null,
      },
      message: "Case updated successfully",
    });
  } catch (error) {
    console.error("Error updating case:", error);

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
        error: "Failed to update case",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid case ID format",
        },
        { status: 400 },
      );
    }

    const [deletedCase] = await db
      .delete(case_status)
      .where(eq(case_status.id, id))
      .returning();

    if (!deletedCase) {
      return NextResponse.json(
        {
          success: false,
          error: "Case not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Case deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete case",
      },
      { status: 500 },
    );
  }
}
