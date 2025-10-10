import { NextRequest, NextResponse } from 'next/server';

import {
  bulkDeleteCaseStatuses,
  createCaseStatus,
  listCaseStatuses,
} from '@/lib/services/case-status';
import { HttpError } from '@/lib/services/errors';
import { parseUuidList } from '@/lib/services/validation';
import { z } from 'zod';

function parsePagination(searchParams: URLSearchParams) {
  const pageParam = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const limitParam = Number.parseInt(searchParams.get('limit') ?? '10', 10);

  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limit = Number.isNaN(limitParam) || limitParam < 1 ? 10 : limitParam;

  return { page, limit };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    const { items, total } = await listCaseStatuses(
      {
        rtc: searchParams.get('rtc'),
        judge: searchParams.get('judge'),
        caseNo: searchParams.get('caseNo'),
        search: searchParams.get('search'),
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
    console.error('Error fetching case statuses:', error);

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
        error: 'Failed to fetch case statuses',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = await createCaseStatus(body);

    return NextResponse.json(
      {
        success: true,
        data: record,
        message: 'Case status created successfully',
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('Error creating case status:', error);

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
        error: 'Failed to create case status',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const { ids, invalid } = parseUuidList(idsParam);

    if (ids.length === 0) {
      throw new HttpError(400, 'Case status IDs are required');
    }

    if (invalid.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid case status IDs provided',
          details: invalid,
        },
        { status: 400 },
      );
    }

    const deleted = await bulkDeleteCaseStatuses(ids);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: `${deleted.length} case statuses deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting case statuses:', error);

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
        error: 'Failed to delete case statuses',
      },
      { status: 500 },
    );
  }
}

