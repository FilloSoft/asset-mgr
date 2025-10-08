import { NextRequest, NextResponse } from 'next/server';
import type { Project } from '@/db/schema';
import {
  bulkDeleteProjects,
  bulkUpdateProjects,
  createProject,
  listProjects,
} from '@/lib/services/projects';
import { HttpError } from '@/lib/services/errors';
import { assertUuid, parseUuidList } from '@/lib/services/validation';
import { z } from 'zod';

const PROJECT_STATUSES: Project['status'][] = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];

function parsePagination(searchParams: URLSearchParams) {
  const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
  const limitParam = Number.parseInt(searchParams.get('limit') || '10', 10);

  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limit = Number.isNaN(limitParam) || limitParam < 1 ? 10 : limitParam;

  return { page, limit };
}

// GET /api/projects - Get all projects with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    const statusParam = searchParams.get('status');
    const status = PROJECT_STATUSES.includes(statusParam as Project['status'])
      ? (statusParam as Project['status'])
      : undefined;

    const search = searchParams.get('search');
    const assetIdParam = searchParams.get('assetId');
    const assetId = assetIdParam ? assertUuid(assetIdParam, 'asset') : undefined;

    const { items, total } = await listProjects(
      {
        status,
        search,
        assetId,
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
    console.error('Error fetching projects:', error);

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
        error: 'Failed to fetch projects',
      },
      { status: 500 },
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const project = await createProject(body);

    return NextResponse.json(
      {
        success: true,
        data: project,
        message: 'Project created successfully',
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error creating project:', error);

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
        error: 'Failed to create project',
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

    const results = await bulkUpdateProjects(projectsToUpdate);

    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.length} projects updated successfully`,
    });
  } catch (error: any) {
    console.error('Error updating projects:', error);

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
        error: 'Failed to update projects',
      },
      { status: 500 },
    );
  }
}

// DELETE /api/projects - Delete all projects (bulk delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const { ids, invalid } = parseUuidList(idsParam);

    if (ids.length === 0) {
      throw new HttpError(400, 'Project IDs are required');
    }

    if (invalid.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project IDs provided',
          details: invalid,
        },
        { status: 400 },
      );
    }

    const deletedProjects = await bulkDeleteProjects(ids);

    return NextResponse.json({
      success: true,
      data: deletedProjects,
      message: `${deletedProjects.length} projects deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting projects:', error);

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
        error: 'Failed to delete projects',
      },
      { status: 500 },
    );
  }
}
