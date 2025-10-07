import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { assets, projects } from '@/db/schema';
import { count, eq, isNull, isNotNull } from 'drizzle-orm';

// GET /api/assets/stats - Get asset and project statistics
export async function GET(request: NextRequest) {
  try {
    // Get asset counts by status
    const assetStats = await db
      .select({
        status: assets.status,
        count: count(),
      })
      .from(assets)
      .groupBy(assets.status);

    // Get project counts by status
    const projectStats = await db
      .select({
        status: projects.status,
        count: count(),
      })
      .from(projects)
      .groupBy(projects.status);

    // Get total counts
    const [{ count: totalAssets }] = await db
      .select({ count: count() })
      .from(assets);

    const [{ count: totalProjects }] = await db
      .select({ count: count() })
      .from(projects);

    // Get assigned vs unassigned projects
    const [{ count: assignedProjects }] = await db
      .select({ count: count() })
      .from(projects)
      .where(isNotNull(projects.assetId));

    const [{ count: unassignedProjects }] = await db
      .select({ count: count() })
      .from(projects)
      .where(isNull(projects.assetId));

    // Get assets with project counts
    const assetsWithProjectCounts = await db
      .select({
        assetId: assets.id,
        assetName: assets.name,
        assetStatus: assets.status,
        projectCount: count(projects.id),
      })
      .from(assets)
      .leftJoin(projects, eq(assets.id, projects.assetId))
      .groupBy(assets.id, assets.name, assets.status);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAssets,
          totalProjects,
          assignedProjects,
          unassignedProjects,
          assignmentRate: totalProjects > 0 ? Math.round((assignedProjects / totalProjects) * 100) : 0,
        },
        assetsByStatus: assetStats.reduce((acc, stat) => {
          acc[stat.status] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        projectsByStatus: projectStats.reduce((acc, stat) => {
          acc[stat.status] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        assetsWithProjectCounts: assetsWithProjectCounts.map(item => ({
          asset: {
            id: item.assetId,
            name: item.assetName,
            status: item.assetStatus,
          },
          projectCount: item.projectCount,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
      },
      { status: 500 }
    );
  }
}