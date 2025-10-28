"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MapPin,
  Copy,
  ExternalLink,
  Calendar,
  Hash,
  Activity,
  FolderOpen,
} from "lucide-react";

interface ProjectSummary {
  id: string;
  name: string;
  status?: string;
  assignedAt?: string | Date | null;
}

interface Asset {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  status: "active" | "inactive" | "maintenance" | "retired";
  projects: ProjectSummary[];
  createdAt?: string;
  updatedAt?: string;
}

interface AssetDetailsSheetProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onManageProjects?: (assetId: string) => void;
}

const statusColors = {
  active: {
    bg: "bg-green-500",
    text: "text-white",
    border: "border-green-300",
    shadow: "shadow-green-200",
  },
  inactive: {
    bg: "bg-gray-500",
    text: "text-white",
    border: "border-gray-300",
    shadow: "shadow-gray-200",
  },
  maintenance: {
    bg: "bg-amber-500",
    text: "text-white",
    border: "border-amber-300",
    shadow: "shadow-amber-200",
  },
  retired: {
    bg: "bg-red-500",
    text: "text-white",
    border: "border-red-300",
    shadow: "shadow-red-200",
  },
};

const statusIcons = {
  active: "🚀",
  inactive: "😴",
  maintenance: "⚡",
  retired: "💀",
};

const projectStatusColors = {
  planning: {
    bg: "bg-blue-500",
    text: "text-white",
  },
  active: {
    bg: "bg-green-500",
    text: "text-white",
  },
  "on-hold": {
    bg: "bg-amber-500",
    text: "text-white",
  },
  completed: {
    bg: "bg-purple-500",
    text: "text-white",
  },
  cancelled: {
    bg: "bg-red-500",
    text: "text-white",
  },
};

export default function AssetDetailsSheet({
  asset,
  isOpen,
  onClose,
  onManageProjects,
}: AssetDetailsSheetProps) {
  if (!asset) return null;

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 bg-white dark:bg-slate-900">
        {/* Hero Header */}
        <div className="text-white">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-4 text-2xl font-bold">
              <div className="text-4xl">{statusIcons[asset.status]}</div>
              <div>
                <div className="text-2xl font-bold">{asset.name}</div>
                <div className="text-sm font-normal mt-1">Asset Details</div>
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(100vh)] overflow-y-auto">
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <div
              className={`px-4 py-2 rounded-full font-medium text-sm backdrop-blur-sm transform hover:scale-105 transition-all duration-200 ${statusColors[asset.status].bg} ${statusColors[asset.status].text} shadow-md`}
            >
              <Activity className="inline-block w-4 h-4 mr-2" />
              {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              Description
            </div>
            <div className="relative group">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {asset.description}
                </p>
              </div>
            </div>
          </div>

          {/* Asset Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
              <Hash className="w-4 h-4 text-purple-600" />
              Asset Information
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Asset ID */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3 text-blue-600" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                      Asset ID
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                      {asset.id.slice(0, 8)}...
                    </span>
                    <button
                      onClick={() => copyToClipboard(asset.id)}
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-all duration-200 hover:scale-105"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                      Location
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                      {asset.location.lat.toFixed(4)},{" "}
                      {asset.location.lng.toFixed(4)}
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${asset.location.lat}, ${asset.location.lng}`,
                        )
                      }
                      className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded transition-all duration-200 hover:scale-105"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              {asset.createdAt && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-purple-600" />
                      <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                        Created
                      </span>
                    </div>
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                      {formatDate(asset.createdAt)}
                    </span>
                  </div>
                </div>
              )}

              {asset.updatedAt && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-amber-600" />
                      <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                        Last Updated
                      </span>
                    </div>
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                      {formatDate(asset.updatedAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Projects Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200">
                <FolderOpen className="w-4 h-4 text-indigo-600" />
                Projects ({asset.projects.length})
              </div>
              {onManageProjects && (
                <button
                  onClick={() => onManageProjects(asset.id)}
                  className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 shadow-md"
                >
                  <FolderOpen className="w-3 h-3" />
                  Manage
                </button>
              )}
            </div>

            {asset.projects.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 text-center border border-gray-200 dark:border-slate-700 shadow-sm">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  No Projects Yet
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  This asset hasn't been assigned to any projects
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {asset.projects.map((project, index) => (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">
                          {project.name}
                        </h4>
                        {project.status && (
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              projectStatusColors[
                                project.status as keyof typeof projectStatusColors
                              ]?.bg || "bg-gray-500"
                            } ${projectStatusColors[project.status as keyof typeof projectStatusColors]?.text || "text-white"}`}
                          >
                            {project.status.replace("-", " ").toUpperCase()}
                          </div>
                        )}
                      </div>

                      {project.assignedAt && (
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>Assigned</span>
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {formatDate(project.assignedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                const url = `https://maps.google.com/maps?q=${asset.location.lat},${asset.location.lng}`;
                window.open(url, "_blank");
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
            >
              <div className="flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View on Map
              </div>
            </button>
            {onManageProjects && (
              <button
                onClick={() => onManageProjects(asset.id)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                <div className="flex items-center justify-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Manage Projects
                </div>
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
