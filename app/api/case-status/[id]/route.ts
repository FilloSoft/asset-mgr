import { NextRequest, NextResponse } from 'next/server';

import {
  deleteCaseStatus,
  getCaseStatusById,
  updateCaseStatus,
} from '@/lib/services/case-status';
import { HttpError } from '@/lib/services/errors';
import { z } from 'zod';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const record = await getCaseStatusById(id);

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: 'Case status not found',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Error fetching case status:', error);

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
        error: 'Failed to fetch case status',
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const record = await updateCaseStatus(id, body);

    return NextResponse.json({
      success: true,
      data: record,
      message: 'Case status updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating case status:', error);

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
        error: 'Failed to update case status',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const record = await deleteCaseStatus(id);

    return NextResponse.json({
      success: true,
      data: record,
      message: 'Case status deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting case status:', error);

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
        error: 'Failed to delete case status',
      },
      { status: 500 },
    );
  }
}

