import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { assets, updateAssetSchema, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { assertUuid } from '@/lib/services/validation';

// GET /api/assets/[id] - Get a specific asset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const assetId = assertUuid(id, 'asset');

    // Get the asset
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
        { status: 404 },
      );
    }

    // Get related projects
    const relatedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.assetId, assetId));

    return NextResponse.json({
      success: true,
      data: {
        ...asset,
        projects: relatedProjects,
      },
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch asset',
      },
      { status: 500 },
    );
  }
}

// PUT /api/assets/[id] - Update a specific asset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const assetId = assertUuid(id, 'asset');
    const body = await request.json();

    // Validate input with Zod schema
    const validatedData = updateAssetSchema.parse(body);

    const [updatedAsset] = await db
      .update(assets)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(assets.id, assetId))
      .returning();

    if (!updatedAsset) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset not found',
        },
        { status: 404 },
      );
    }

    // Get related projects for the updated asset
    const relatedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.assetId, assetId));

    return NextResponse.json({
      success: true,
      data: {
        ...updatedAsset,
        projects: relatedProjects,
      },
      message: 'Asset updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating asset:', error);

    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
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
        error: 'Failed to update asset',
      },
      { status: 500 },
    );
  }
}

// DELETE /api/assets/[id] - Delete a specific asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const assetId = assertUuid(id, 'asset');

    // First, unlink all projects from this asset
    await db
      .update(projects)
      .set({ assetId: null, assignedAt: null })
      .where(eq(projects.assetId, assetId));

    // Then delete the asset
    const [deletedAsset] = await db
      .delete(assets)
      .where(eq(assets.id, assetId))
      .returning();

    if (!deletedAsset) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedAsset,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete asset',
      },
      { status: 500 },
    );
  }
}
