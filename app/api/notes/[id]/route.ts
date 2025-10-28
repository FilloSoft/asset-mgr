"use server";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid note ID format",
        },
        { status: 400 },
      );
    }

    const [deletedNote] = await db
      .delete(notes)
      .where(eq(notes.id, id))
      .returning();

    if (!deletedNote) {
      return NextResponse.json(
        {
          success: false,
          error: "Note not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete note" },
      { status: 500 },
    );
  }
}
