import { NextRequest, NextResponse } from 'next/server';
import type { Asset } from '@/db/schema';
import { createAsset, listAssetsWithProjects, bulkUpdateAssets, bulkDeleteAssets } from '@/lib/services/assets';
import { HttpError } from '@/lib/services/errors';
import { parseUuidList } from '@/lib/services/validation';
import { z } from 'zod';

const ASSET_STATUSES: Asset['status'][] = ['active', 'inactive', 'maintenance', 'retired'];

function parsePagination(searchParams: URLSearchParams) {
  const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
  const limitParam = Number.parseInt(searchParams.get('limit') || '10', 10);

  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limit = Number.isNaN(limitParam) || limitParam < 1 ? 10 : limitParam;

  return { page, limit };
}

// GET /api/assets - Get all assets with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    const statusParam = searchParams.get('status');
    const status = ASSET_STATUSES.includes(statusParam as Asset['status'])
      ? (statusParam as Asset['status'])
      : undefined;

    const search = searchParams.get('search');

    const { items, total } = await listAssetsWithProjects(
      {
        status,
        search,
      },
      { page, limit },
    );

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching assets:', error);

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
        error: 'Failed to fetch assets',
      },
      { status: 500 },
    );
  }
}

// POST /api/assets - Create a new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newAsset = await createAsset(body);

    return NextResponse.json(
      {
        success: true,
        data: newAsset,
        message: 'Asset created successfully',
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error creating asset:', error);

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
        error: 'Failed to create asset',
      },
      { status: 500 },
    );
  }
}

// PUT /api/assets - Update all assets (bulk update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assets: assetsToUpdate } = body;

    const results = await bulkUpdateAssets(assetsToUpdate);

    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.length} assets updated successfully`,
    });
  } catch (error: any) {
    console.error('Error updating assets:', error);

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
        error: 'Failed to update assets',
      },
      { status: 500 },
    );
  }
}

// DELETE /api/assets - Delete all assets (bulk delete)
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

    const deletedAssets = await bulkDeleteAssets(ids);

    return NextResponse.json({
      success: true,
      data: deletedAssets,
      message: `${deletedAssets.length} assets deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting assets:', error);

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
