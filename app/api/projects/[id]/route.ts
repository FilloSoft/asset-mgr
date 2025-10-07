import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { projects, updateProjectSchema, assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/projects/[id] - Get a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID format',
        },
        { status: 400 }
      );
    }

    // Get the project with its associated asset
    const result = await db
      .select({
        project: projects,
        asset: assets,
      })
      .from(projects)
      .leftJoin(assets, eq(projects.assetId, assets.id))
      .where(eq(projects.id, id));

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    const { project, asset } = result[0];

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        asset: asset || null,
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch project',
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a specific project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID format',
        },
        { status: 400 }
      );
    }

    // Validate input with Zod schema
    const validatedData = updateProjectSchema.parse(body);

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

    if (!updatedProject) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // Get the associated asset if any
    let associatedAsset = null;
    if (updatedProject.assetId) {
      [associatedAsset] = await db
        .select()
        .from(assets)
        .where(eq(assets.id, updatedProject.assetId));
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProject,
        asset: associatedAsset,
      },
      message: 'Project updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating project:', error);

    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update project',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a specific project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID format',
        },
        { status: 400 }
      );
    }

    // Delete the project
    const [deletedProject] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();

    if (!deletedProject) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedProject,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete project',
      },
      { status: 500 }
    );
  }
}