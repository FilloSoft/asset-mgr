"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface LinkedAsset {
  id: string;
  name: string;
  status?: string | null;
}

interface LinkedProject {
  id: string;
  name: string;
  status?: string | null;
}

interface LinkedCase {
  id: string;
  caseNo: string;
  rtc: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  assetId?: string | null;
  projectId?: string | null;
  caseId?: string | null;
  asset?: LinkedAsset | null;
  project?: LinkedProject | null;
  case?: LinkedCase | null;
}

type NoteEntity = "asset" | "project" | "case";

interface NotesPanelProps {
  entity: NoteEntity;
  entityId: string | undefined;
  title?: string;
}

function entityParam(entity: NoteEntity) {
  switch (entity) {
    case "asset":
      return "assetId";
    case "project":
      return "projectId";
    case "case":
      return "caseId";
    default:
      return "assetId";
  }
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotesPanel({
  entity,
  entityId,
  title = "Notes",
}: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = content.trim().length > 0 && Boolean(entityId);

  const loadNotes = useCallback(async () => {
    if (!entityId) {
      setNotes([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: "20",
      });
      params.set(entityParam(entity), entityId);

      const response = await fetch(`/api/notes?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setNotes(data.data ?? []);
      } else {
        setError(data.error || "Failed to load notes");
      }
    } catch (err) {
      console.error("Error loading notes:", err);
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [entity, entityId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !entityId) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload: Record<string, unknown> = {
        content: content.trim(),
      };
      payload[entityParam(entity)] = entityId;

      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save note");
      }

      setContent("");
      await loadNotes();
    } catch (err) {
      console.error("Error saving note:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save note. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const emptyStateMessage = useMemo(() => {
    if (!entityId) {
      return `Select a ${entity} to view notes.`;
    }
    return "No notes yet.";
  }, [entity, entityId]);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {loading && (
          <span className="text-xs text-gray-500">Refreshing...</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={
            entityId
              ? "Add a new note..."
              : `Select a ${entity} before adding notes.`
          }
          disabled={submitting || !entityId}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-slate-800"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Add Note"}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            {emptyStateMessage}
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 bg-gray-50 dark:bg-slate-800 text-sm space-y-2"
            >
              <p className="text-gray-800 dark:text-gray-100 whitespace-pre-line">
                {note.content}
              </p>
              <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                <span>Added {formatTimestamp(note.createdAt)}</span>
                {note.asset && entity !== "asset" && (
                  <span>Asset: {note.asset.name}</span>
                )}
                {note.project && entity !== "project" && (
                  <span>Project: {note.project.name}</span>
                )}
                {note.case && entity !== "case" && (
                  <span>Case: {note.case.caseNo}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
