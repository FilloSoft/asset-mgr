import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { assets, projects, insertAssetSchema } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { HttpError } from '@/lib/services/errors';
import { parseUuidList } from '@/lib/services/validation';

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
        { status: 400 },
      );
    }

    const validatedAssets = assetsToCreate.map((asset) => insertAssetSchema.parse(asset));

    const newAssets = await db
      .insert(assets)
      .values(
        validatedAssets.map((asset) => ({
          ...asset,
          updatedAt: new Date(),
        })),
      )
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newAssets,
        message: `${newAssets.length} assets created successfully`,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error creating assets:', error);

    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create assets',
      },
      { status: 500 },
    );
  }
}

// PUT /api/assets/bulk - Bulk assign projects to assets
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments } = body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      throw new HttpError(400, 'Expected a non-empty array of assignment objects');
    }

    // Validate assignment format
    const assignmentSchema = z.object({
      projectId: z.string().uuid('Invalid project ID'),
      assetId: z.string().uuid('Invalid asset ID').nullable(),
    });

    const validatedAssignments = assignments.map((assignment) => assignmentSchema.parse(assignment));

    // Perform bulk updates inside a transaction to ensure consistency
    const results = await db.transaction(async (tx) => {
      const updates: typeof projects.$inferSelect[] = [];

      for (const { projectId, assetId } of validatedAssignments) {
        const [updatedProject] = await tx
          .update(projects)
          .set({
            assetId,
            assignedAt: assetId ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, projectId))
          .returning();

        if (!updatedProject) {
          throw new HttpError(404, `Project ${projectId} not found`);
        }

        updates.push(updatedProject);
      }

      return updates;
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.length} project assignments updated successfully`,
    });
  } catch (error: any) {
    console.error('Error updating project assignments:', error);

    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof HttpError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update project assignments',
      },
      { status: 500 },
    );
  }
}

// DELETE /api/assets/bulk - Bulk delete assets
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    const { ids, invalid } = parseUuidList(idsParam);

    if (ids.length === 0) {
      throw new HttpError(400, 'Asset IDs are required');
    }

    if (invalid.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid asset IDs provided',
          details: invalid,
        },
        { status: 400 },
      );
    }

    const deletedAssets = await db.transaction(async (tx) => {
      await tx
        .update(projects)
        .set({ assetId: null, assignedAt: null })
        .where(inArray(projects.assetId, ids));

      return tx
        .delete(assets)
        .where(inArray(assets.id, ids))
        .returning();
    });

    return NextResponse.json({
      success: true,
      data: deletedAssets,
      message: `${deletedAssets.length} assets deleted successfully`,
    });
  } catch (error) {
    console.error('Error bulk deleting assets:', error);

    if (error instanceof HttpError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete assets',
      },
      { status: 500 },
    );
  }
}
