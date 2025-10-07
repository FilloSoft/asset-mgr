import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { assets, insertAssetSchema, updateAssetSchema, projects } from '@/db/schema';
import { desc, ilike, or, count, eq, and } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/assets - Get all assets with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'active' | 'inactive' | 'maintenance' | 'retired' | null;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(assets.status, status));
    }
    if (search) {
      conditions.push(
        or(
          ilike(assets.name, `%${search}%`),
          ilike(assets.description, `%${search}%`)
        )
      );
    }

    // Get assets with pagination
    const assetsQuery = db
      .select()
      .from(assets)
      .orderBy(desc(assets.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      assetsQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const assetsResult = await assetsQuery;

    // Get assets with their projects
    const assetsWithProjects = await Promise.all(
      assetsResult.map(async (asset) => {
        const relatedProjects = await db
          .select()
          .from(projects)
          .where(eq(projects.assetId, asset.id));

        return {
          ...asset,
          projects: relatedProjects,
        };
      })
    );

    // Get total count for pagination
    const totalQuery = db
      .select({ count: count() })
      .from(assets);

    if (conditions.length > 0) {
      totalQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const [{ count: total }] = await totalQuery;

    return NextResponse.json({
      success: true,
      data: assetsWithProjects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch assets',
      },
      { status: 500 }
    );
  }
}

// POST /api/assets - Create a new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input with Zod schema
    const validatedData = insertAssetSchema.parse(body);
    
    const [newAsset] = await db
      .insert(assets)
      .values({
        ...validatedData,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newAsset,
        message: 'Asset created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating asset:', error);
    
    // Handle validation errors
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
        error: 'Failed to create asset',
      },
      { status: 500 }
    );
  }
}

// PUT /api/assets - Update all assets (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assets: assetsToUpdate } = body;

    if (!Array.isArray(assetsToUpdate)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expected an array of assets',
        },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      assetsToUpdate.map(async (assetData: any) => {
        const { id, ...updateData } = assetData;
        
        if (!id) {
          throw new Error('Asset ID is required for update');
        }

        const validatedData = updateAssetSchema.parse(updateData);
        
        const [updatedAsset] = await db
          .update(assets)
          .set({
            ...validatedData,
            updatedAt: new Date(),
          })
          .where(eq(assets.id, id))
          .returning();

        return updatedAsset;
      })
    );

    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.length} assets updated successfully`,
    });
  } catch (error: any) {
    console.error('Error updating assets:', error);
    
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
        error: 'Failed to update assets',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/assets - Delete all assets (bulk delete)
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

    // Set assetId to null for all projects linked to these assets
    await db
      .update(projects)
      .set({ assetId: null, assignedAt: null })
      .where(eq(projects.assetId, ids[0])); // This will be updated to handle multiple IDs

    // For multiple IDs, we need to use 'or' condition
    if (ids.length > 1) {
      await db
        .update(projects)
        .set({ assetId: null, assignedAt: null })
        .where(or(...ids.map(id => eq(projects.assetId, id))));
    }

    // Delete the assets
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
    console.error('Error deleting assets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete assets',
      },
      { status: 500 }
    );
  }
}