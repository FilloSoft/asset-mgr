"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Calendar,
  ClipboardList,
  Hash,
  Info,
  Link as LinkIcon,
  FileText,
} from "lucide-react";

interface AssetSummary {
  id: string;
  name: string;
  status?: string;
}

interface ProjectDetails {
  id: string;
  name: string;
  description?: string;
  status: "planning" | "active" | "on-hold" | "completed" | "cancelled";
  assetId?: string | null;
  carStatus?: string;
  startDate?: string;
  endDate?: string;
  assignedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  asset?: AssetSummary | null;
}

interface ProjectDetailsSheetProps {
  project: ProjectDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

const projectStatusStyles = {
  planning: "bg-blue-500 text-white",
  active: "bg-green-500 text-white",
  "on-hold": "bg-amber-500 text-white",
  completed: "bg-purple-500 text-white",
  cancelled: "bg-red-500 text-white",
};

const assetStatusStyles = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  maintenance: "bg-amber-100 text-amber-800",
  retired: "bg-red-100 text-red-800",
};

function formatDate(dateString?: string) {
  if (!dateString) return "Not set";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error("Unable to copy text", error);
  }
}

export default function ProjectDetailsSheet({
  project,
  isOpen,
  onClose,
}: ProjectDetailsSheetProps) {
  if (!project) return null;

  const statusStyle =
    projectStatusStyles[project.status] ?? "bg-gray-200 text-gray-800";

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-[380px] sm:w-[520px] p-0 bg-white dark:bg-slate-900">
        <SheetHeader className="px-6 py-4 text-left border-b border-gray-100 dark:border-slate-800">
          <SheetTitle className="flex items-start gap-3">
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusStyle}`}
            >
              {project.status.replace("-", " ")}
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {project.name}
              </div>
            </div>
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-600 dark:text-gray-400">
            Project overview and assignment details
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-5 max-h-[calc(100vh)] overflow-y-auto">
          {project.description && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 font-semibold text-sm text-gray-700 dark:text-gray-200 mb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Description
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {project.description}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-indigo-500" />
              Project Timeline
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  Start Date
                </div>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  {formatDate(project.startDate)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  End Date
                </div>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  {formatDate(project.endDate)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3" />
                  Assigned
                </div>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                  {formatDate(project.assignedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-500" />
              Project Info
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Hash className="w-3 h-3" />
                    Project ID
                  </div>
                  <button
                    onClick={() => copyToClipboard(project.id)}
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
                  >
                    <LinkIcon className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <div className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 px-2 py-1 rounded">
                  {project.id}
                </div>
              </div>

              {project.carStatus && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <Info className="w-3 h-3" />
                    Car Status
                  </div>
                  <div className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    {project.carStatus}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-500" />
              Assignment
            </h3>
            {project.asset ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {project.asset.name}
                  </div>
                  {project.asset.status && (
                    <span
                      className={`text-[11px] px-2 py-1 rounded-full ${assetStatusStyles[project.asset.status as keyof typeof assetStatusStyles] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {project.asset.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Asset ID</span>
                  <button
                    onClick={() =>
                      project.asset?.id && copyToClipboard(project.asset.id)
                    }
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    <LinkIcon className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <div className="font-mono text-[11px] bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 px-2 py-1 rounded">
                  {project.asset.id}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                This project is not currently assigned to an asset.
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Created</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {formatDate(project.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Updated</span>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {formatDate(project.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
