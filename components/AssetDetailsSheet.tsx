'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MapPin, Copy, ExternalLink, Calendar, Hash, Activity, FolderOpen } from 'lucide-react';

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
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
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
    bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
    text: 'text-white',
    border: 'border-emerald-300',
    shadow: 'shadow-emerald-200',
    glow: 'shadow-lg shadow-emerald-500/25',
  },
  inactive: {
    bg: 'bg-gradient-to-r from-slate-400 to-gray-500',
    text: 'text-white',
    border: 'border-gray-300',
    shadow: 'shadow-gray-200',
    glow: 'shadow-lg shadow-gray-500/25',
  },
  maintenance: {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    text: 'text-white',
    border: 'border-amber-300',
    shadow: 'shadow-amber-200',
    glow: 'shadow-lg shadow-amber-500/25',
  },
  retired: {
    bg: 'bg-gradient-to-r from-red-500 to-rose-500',
    text: 'text-white',
    border: 'border-red-300',
    shadow: 'shadow-red-200',
    glow: 'shadow-lg shadow-red-500/25',
  },
};

const statusIcons = {
  active: '🚀',
  inactive: '😴',
  maintenance: '⚡',
  retired: '💀',
};

const projectStatusColors = {
  planning: {
    bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    text: 'text-white',
    glow: 'shadow-lg shadow-blue-500/25',
  },
  active: {
    bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
    text: 'text-white', 
    glow: 'shadow-lg shadow-emerald-500/25',
  },
  'on-hold': {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    text: 'text-white',
    glow: 'shadow-lg shadow-amber-500/25',
  },
  completed: {
    bg: 'bg-gradient-to-r from-purple-500 to-violet-500',
    text: 'text-white',
    glow: 'shadow-lg shadow-purple-500/25',
  },
  cancelled: {
    bg: 'bg-gradient-to-r from-red-500 to-rose-500',
    text: 'text-white',
    glow: 'shadow-lg shadow-red-500/25',
  },
};

export default function AssetDetailsSheet({ asset, isOpen, onClose, onManageProjects }: AssetDetailsSheetProps) {
  if (!asset) return null;

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950">
        {/* Hero Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-4 text-2xl font-bold text-white mb-2">
                <div className="text-4xl animate-pulse">{statusIcons[asset.status]}</div>
                <div>
                  <div className="text-2xl font-bold">{asset.name}</div>
                  <div className="text-blue-100 text-sm font-normal mt-1">Asset Details</div>
                </div>
              </SheetTitle>
            </SheetHeader>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <div className={`px-4 py-2 rounded-full font-medium text-sm backdrop-blur-sm transform hover:scale-105 transition-all duration-200 ${statusColors[asset.status].bg} ${statusColors[asset.status].text} ${statusColors[asset.status].glow}`}>
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
              <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-3 rounded-lg border border-white/20 shadow-md hover:shadow-lg transition-all duration-200">
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
              <div className="bg-gradient-to-r from-white/80 to-blue-50/80 dark:from-slate-800/80 dark:to-blue-950/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3 text-blue-600" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Asset ID</span>
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
              <div className="bg-gradient-to-r from-white/80 to-emerald-50/80 dark:from-slate-800/80 dark:to-emerald-950/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                      {asset.location.lat.toFixed(4)}, {asset.location.lng.toFixed(4)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(`${asset.location.lat}, ${asset.location.lng}`)}
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
                <div className="bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-slate-800/80 dark:to-purple-950/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 shadow-md hover:shadow-lg transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-purple-600" />
                      <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Created</span>
                    </div>
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                      {formatDate(asset.createdAt)}
                    </span>
                  </div>
                </div>
              )}

              {asset.updatedAt && (
                <div className="bg-gradient-to-r from-white/80 to-amber-50/80 dark:from-slate-800/80 dark:to-amber-950/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 shadow-md hover:shadow-lg transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-amber-600" />
                      <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">Last Updated</span>
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
                  className="flex items-center gap-1 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 shadow-md"
                >
                  <FolderOpen className="w-3 h-3" />
                  Manage
                </button>
              )}
            </div>

            {asset.projects.length === 0 ? (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-950 rounded-lg p-6 text-center border border-slate-200 dark:border-slate-700">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">No Projects Yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">This asset hasn't been assigned to any projects</p>
              </div>
            ) : (
              <div className="space-y-2">
                {asset.projects.map((project, index) => (
                  <div key={project.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg border border-white/30 shadow-md hover:shadow-lg transition-all duration-200">
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">
                          {project.name}
                        </h4>
                        {project.status && (
                          <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                            projectStatusColors[project.status as keyof typeof projectStatusColors]?.bg || 'bg-gradient-to-r from-gray-500 to-slate-500'
                          } ${projectStatusColors[project.status as keyof typeof projectStatusColors]?.text || 'text-white'}`}>
                            {project.status.replace('-', ' ').toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {project.assignedAt && (
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>Assigned</span>
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(project.assignedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-white/20">
            <button
              onClick={() => {
                const url = `https://maps.google.com/maps?q=${asset.location.lat},${asset.location.lng}`;
                window.open(url, '_blank');
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
            >
              <div className="flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View on Map
              </div>
            </button>
            {onManageProjects && (
              <button
                onClick={() => onManageProjects(asset.id)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
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