import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { assets, projects, insertAssetSchema } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';

// POST /api/assets/bulk - Create multiple assets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assets: assetsToCreate } = body;

    if (!Array.isArray(assetsToCreate)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expected an array of assets',
        },
        { status: 400 }
      );
    }

    const validatedAssets = assetsToCreate.map(asset => insertAssetSchema.parse(asset));
    
    const newAssets = await db
      .insert(assets)
      .values(validatedAssets.map(asset => ({
        ...asset,
        updatedAt: new Date(),
      })))
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newAssets,
        message: `${newAssets.length} assets created successfully`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating assets:', error);
    
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
        error: 'Failed to create assets',
      },
      { status: 500 }
    );
  }
}

// PUT /api/assets/bulk - Bulk assign projects to assets
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments } = body;

    if (!Array.isArray(assignments)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expected an array of assignment objects',
        },
        { status: 400 }
      );
    }

    // Validate assignment format
    const assignmentSchema = z.object({
      projectId: z.string().uuid('Invalid project ID'),
      assetId: z.string().uuid('Invalid asset ID').nullable(),
    });

    const validatedAssignments = assignments.map(assignment => 
      assignmentSchema.parse(assignment)
    );

    // Perform bulk updates
    const results = await Promise.all(
      validatedAssignments.map(async ({ projectId, assetId }) => {
        const [updatedProject] = await db
          .update(projects)
          .set({
            assetId: assetId,
            assignedAt: assetId ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId))
          .returning();

        return updatedProject;
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.length} project assignments updated successfully`,
    });
  } catch (error: any) {
    console.error('Error updating project assignments:', error);
    
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
        error: 'Failed to update project assignments',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/bulk - Bulk delete assets
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    if (!idsParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset IDs are required',
        },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',').map(id => id.trim());
    
    // Validate all IDs are UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = ids.filter(id => !uuidRegex.test(id));
    
    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid asset IDs provided',
          details: invalidIds,
        },
        { status: 400 }
      );
    }

    // First, unlink all projects from these assets
    await db
      .update(projects)
      .set({ assetId: null, assignedAt: null })
      .where(or(...ids.map(id => eq(projects.assetId, id))));

    // Then delete the assets
    const deletedAssets = await db
      .delete(assets)
      .where(or(...ids.map(id => eq(assets.id, id))))
      .returning();

    return NextResponse.json({
      success: true,
      data: deletedAssets,
      message: `${deletedAssets.length} assets deleted successfully`,
    });
  } catch (error) {
    console.error('Error bulk deleting assets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete assets',
      },
      { status: 500 }
    );
  }
}