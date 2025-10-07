import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { projects, assets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/assets/[id]/projects/[projectId] - Get a specific project assigned to an asset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const { id: assetId, projectId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(assetId) || !uuidRegex.test(projectId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format',
        },
        { status: 400 }
      );
    }

    // Get the project and verify it's assigned to the specified asset
    const result = await db
      .select({
        project: projects,
        asset: assets,
      })
      .from(projects)
      .leftJoin(assets, eq(projects.assetId, assets.id))
      .where(and(eq(projects.id, projectId), eq(projects.assetId, assetId)));

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found or not assigned to this asset',
        },
        { status: 404 }
      );
    }

    const { project, asset } = result[0];

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        asset: asset,
      },
    });
  } catch (error) {
    console.error('Error fetching project assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch project assignment',
      },
      { status: 500 }
    );
  }
}

// PUT /api/assets/[id]/projects/[projectId] - Assign an existing project to an asset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const { id: assetId, projectId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(assetId) || !uuidRegex.test(projectId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format',
        },
        { status: 400 }
      );
    }

    // Check if asset exists
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, assetId));

    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset not found',
        },
        { status: 404 }
      );
    }

    // Check if project exists
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // Assign the project to the asset
    const [updatedProject] = await db
      .update(projects)
      .set({
        assetId: assetId,
        assignedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProject,
        asset: asset,
      },
      message: 'Project assigned to asset successfully',
    });
  } catch (error) {
    console.error('Error assigning project to asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to assign project to asset',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[id]/projects/[projectId] - Unassign a project from an asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const { id: assetId, projectId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(assetId) || !uuidRegex.test(projectId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format',
        },
        { status: 400 }
      );
    }

    // Verify the project is assigned to this asset
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.assetId, assetId)));

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found or not assigned to this asset',
        },
        { status: 404 }
      );
    }

    // Unassign the project from the asset
    const [updatedProject] = await db
      .update(projects)
      .set({
        assetId: null,
        assignedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProject,
        asset: null,
      },
      message: 'Project unassigned from asset successfully',
    });
  } catch (error) {
    console.error('Error unassigning project from asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to unassign project from asset',
      },
      { status: 500 }
    );
  }
}