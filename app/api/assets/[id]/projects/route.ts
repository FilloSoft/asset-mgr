import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { projects, assets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/assets/[id]/projects - Get all projects for a specific asset
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
          error: 'Invalid asset ID format',
        },
        { status: 400 }
      );
    }

    // Check if asset exists
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id));

    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset not found',
        },
        { status: 404 }
      );
    }

    // Get all projects for this asset
    const relatedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.assetId, id));

    return NextResponse.json({
      success: true,
      data: relatedProjects,
      meta: {
        assetId: id,
        assetName: asset.name,
        totalProjects: relatedProjects.length,
      },
    });
  } catch (error) {
    console.error('Error fetching asset projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch asset projects',
      },
      { status: 500 }
    );
  }
}

// POST /api/assets/[id]/projects - Create a new project and assign it to this asset
export async function POST(
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
          error: 'Invalid asset ID format',
        },
        { status: 400 }
      );
    }

    // Check if asset exists
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, id));

    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset not found',
        },
        { status: 404 }
      );
    }

    // Validate project data
    const projectSchema = z.object({
      name: z.string().min(1, 'Project name is required').trim(),
      description: z.string().optional(),
      status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']).default('planning'),
      startDate: z.union([
        z.string().datetime('Invalid date format').transform(str => new Date(str)),
        z.date(),
        z.null()
      ]).optional(),
      endDate: z.union([
        z.string().datetime('Invalid date format').transform(str => new Date(str)),
        z.date(),
        z.null()
      ]).optional(),
    });

    const validatedData = projectSchema.parse(body);

    // Create the project with the asset assignment
    const [newProject] = await db
      .insert(projects)
      .values({
        ...validatedData,
        assetId: id,
        assignedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newProject,
          asset: asset,
        },
        message: 'Project created and assigned to asset successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating project for asset:', error);

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
        error: 'Failed to create project for asset',
      },
      { status: 500 }
    );
  }
}