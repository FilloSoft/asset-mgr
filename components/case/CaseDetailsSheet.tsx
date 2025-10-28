"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import NotesPanel from "@/components/note/NotesPanel";
import {
  CalendarClock,
  ClipboardCopy,
  FileText,
  Gavel,
  Hash,
  Landmark,
  User,
  Workflow,
} from "lucide-react";

export interface AssetSummary {
  id: string;
  name: string;
  status?: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  status?: string | null;
}

export interface CaseRecord {
  id: string;
  rtc: string;
  caseNo: string;
  lastUpdatedAt: string;
  details?: string | null;
  judge?: string | null;
  assetId?: string | null;
  projectId?: string | null;
  asset?: AssetSummary | null;
  project?: ProjectSummary | null;
}

interface CaseDetailsSheetProps {
  caseRecord: CaseRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (caseRecord: CaseRecord) => void;
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
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
    console.error("Failed to copy text:", error);
  }
}

export default function CaseDetailsSheet({
  caseRecord,
  isOpen,
  onClose,
  onEdit,
}: CaseDetailsSheetProps) {
  if (!caseRecord) {
    return null;
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent className="w-[380px] sm:w-[520px] p-0 bg-white dark:bg-slate-900">
        <SheetHeader className="px-6 py-4 text-left border-b border-gray-100 dark:border-slate-800">
          <SheetTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Gavel className="w-6 h-6 text-indigo-500" />
            <span>{caseRecord.caseNo}</span>
          </SheetTitle>
          <SheetDescription className="text-sm text-gray-600 dark:text-gray-400">
            {caseRecord.rtc}
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-5 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <CalendarClock className="w-4 h-4 text-blue-500" />
                <span>Last Updated</span>
              </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                {formatDate(caseRecord.lastUpdatedAt)}
              </span>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <FileText className="w-4 h-4 text-emerald-500" />
              Case Details
            </div>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-lg">
                <span className="font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  Case ID
                </span>
                <button
                  onClick={() => copyToClipboard(caseRecord.id)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <ClipboardCopy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded">
                {caseRecord.id}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                    RTC
                  </div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {caseRecord.rtc}
                  </div>
                </div>

                {caseRecord.judge && (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold flex items-center gap-1">
                      <User className="w-3 h-3 text-purple-500" />
                      Presiding Judge
                    </div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {caseRecord.judge}
                    </div>
                  </div>
                )}
              </div>

              {caseRecord.details && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Notes
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {caseRecord.details}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <Workflow className="w-4 h-4 text-orange-500" />
              Associations
            </div>

            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    <Landmark className="w-3 h-3 text-emerald-500" />
                    Asset
                  </div>
                  {caseRecord.assetId && (
                    <button
                      onClick={() => copyToClipboard(caseRecord.assetId!)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <ClipboardCopy className="w-3 h-3" />
                      Copy ID
                    </button>
                  )}
                </div>
                {caseRecord.asset ? (
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {caseRecord.asset.name}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Not assigned to an asset
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    <Workflow className="w-3 h-3 text-indigo-500" />
                    Project
                  </div>
                  {caseRecord.projectId && (
                    <button
                      onClick={() => copyToClipboard(caseRecord.projectId!)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <ClipboardCopy className="w-3 h-3" />
                      Copy ID
                    </button>
                  )}
                </div>
                {caseRecord.project ? (
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {caseRecord.project.name}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Not linked to a project
                  </div>
                )}
              </div>
            </div>
          </section>

          <NotesPanel entity="case" entityId={caseRecord.id} />

          {onEdit && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => onEdit(caseRecord)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Edit Case
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
