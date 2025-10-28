import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import {
  projects,
  insertProjectSchema,
  updateProjectSchema,
  assets,
} from "@/db/schema";
import {
  desc,
  ilike,
  or,
  count,
  eq,
  and,
  isNull,
  isNotNull,
} from "drizzle-orm";
import { z } from "zod";

// GET /api/projects - Get all projects with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as
      | "planning"
      | "active"
      | "on-hold"
      | "completed"
      | "cancelled"
      | null;
    const search = searchParams.get("search");
    const assetId = searchParams.get("assetId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(projects.status, status));
    }
    if (assetId) {
      const normalizedAssetFilter = assetId.trim();
      if (normalizedAssetFilter.length > 0) {
        const normalizedLower = normalizedAssetFilter.toLowerCase();
        if (normalizedLower === "unassigned") {
          conditions.push(isNull(projects.assetId));
        } else if (normalizedLower === "assigned") {
          conditions.push(isNotNull(projects.assetId));
        } else {
          conditions.push(
            or(
              eq(projects.assetId, normalizedAssetFilter),
              ilike(assets.name, `%${normalizedAssetFilter}%`),
            ),
          );
        }
      }
    }
    if (search) {
      conditions.push(
        or(
          ilike(projects.name, `%${search}%`),
          ilike(projects.description, `%${search}%`),
        ),
      );
    }

    // Get projects with pagination
    const projectsQuery = db
      .select({
        project: projects,
        asset: assets,
      })
      .from(projects)
      .leftJoin(assets, eq(projects.assetId, assets.id))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      projectsQuery.where(
        conditions.length === 1 ? conditions[0] : and(...conditions),
      );
    }

    const projectsResult = await projectsQuery;

    // Transform the result to include asset data properly
    const projectsWithAssets = projectsResult.map(({ project, asset }) => ({
      ...project,
      asset: asset || null,
    }));

    // Get total count for pagination
    const totalQuery = db
      .select({ count: count() })
      .from(projects)
      .leftJoin(assets, eq(projects.assetId, assets.id));

    if (conditions.length > 0) {
      totalQuery.where(
        conditions.length === 1 ? conditions[0] : and(...conditions),
      );
    }

    const [{ count: total }] = await totalQuery;

    return NextResponse.json({
      success: true,
      data: projectsWithAssets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
      },
      { status: 500 },
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod schema
    const validatedData = insertProjectSchema.parse(body);

    // If assetId is provided, set assignedAt to current time
    const projectData = {
      ...validatedData,
      assignedAt: validatedData.assetId ? new Date() : null,
      updatedAt: new Date(),
    };

    const [newProject] = await db
      .insert(projects)
      .values(projectData)
      .returning();

    // Get the associated asset if any
    let associatedAsset = null;
    if (newProject.assetId) {
      [associatedAsset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, newProject.assetId));
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newProject,
          asset: associatedAsset,
        },
        message: "Project created successfully",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating project:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err: any) => `${err.path.join(".")}: ${err.message}`,
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create project",
      },
      { status: 500 },
    );
  }
}

// PUT /api/projects - Update all projects (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projects: projectsToUpdate } = body;

    if (!Array.isArray(projectsToUpdate)) {
      return NextResponse.json(
        {
          success: false,
          error: "Expected an array of projects",
        },
        { status: 400 },
      );
    }

    const results = await Promise.all(
      projectsToUpdate.map(async (projectData: any) => {
        const { id, ...updateData } = projectData;

        if (!id) {
          throw new Error("Project ID is required for update");
        }

        const validatedData = updateProjectSchema.parse(updateData);

        // If assetId is being updated, set/unset assignedAt accordingly
        const projectUpdateData = {
          ...validatedData,
          assignedAt: validatedData.assetId ? new Date() : null,
          updatedAt: new Date(),
        };

        const [updatedProject] = await db
          .update(projects)
          .set(projectUpdateData)
          .where(eq(projects.id, id))
          .returning();

        // Get the associated asset if any
        let associatedAsset = null;
        if (updatedProject.assetId) {
          [associatedAsset] = await db
            .select()
            .from(assets)
            .where(eq(assets.id, updatedProject.assetId));
        }

        return {
          ...updatedProject,
          asset: associatedAsset,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.length} projects updated successfully`,
    });
  } catch (error: any) {
    console.error("Error updating projects:", error);

    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err: any) => `${err.path.join(".")}: ${err.message}`,
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update projects",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/projects - Delete all projects (bulk delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        {
          success: false,
          error: "Project IDs are required",
        },
        { status: 400 },
      );
    }

    const ids = idsParam.split(",").map((id) => id.trim());

    // Validate all IDs are UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = ids.filter((id) => !uuidRegex.test(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project IDs provided",
          details: invalidIds,
        },
        { status: 400 },
      );
    }

    // Delete the projects
    const deletedProjects = await db
      .delete(projects)
      .where(or(...ids.map((id) => eq(projects.id, id))))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedProjects,
      message: `${deletedProjects.length} projects deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete projects",
      },
      { status: 500 },
    );
  }
}
