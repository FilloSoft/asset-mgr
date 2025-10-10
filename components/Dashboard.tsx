"use client";

import type { JSX, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, Briefcase, ClipboardList, FolderX, X } from "lucide-react";

import AssetDetailsSheet from "./AssetDetailsSheet";
import AssetMap from "./AssetMap";
import AssetProjectManager from "./AssetProjectManager";

type AssetStatus = "active" | "inactive" | "maintenance" | "retired";
type ProjectStatus =
  | "planning"
  | "active"
  | "on-hold"
  | "completed"
  | "cancelled"
  | string;

interface DashboardProject {
  id: string;
  name: string;
  status: ProjectStatus;
  assignedAt?: string;
  description?: string;
  asset?: {
    id: string;
    name: string;
    status: AssetStatus;
  };
}

interface DashboardAsset {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  status: AssetStatus;
  projects: DashboardProject[];
  createdAt: string;
  updatedAt: string;
}

interface StatsSummary {
  totalAssets: number;
  totalProjects: number;
  assignedProjects: number;
  unassignedProjects: number;
  assignmentRate: number;
}

interface Stats {
  summary: StatsSummary;
  assetsByStatus: Record<string, number>;
  projectsByStatus: Record<string, number>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface AssetsResponse {
  id: string;
  name: string;
  description?: string | null;
  location: {
    lat: number;
    lng: number;
  };
  status: AssetStatus;
  projects?: Array<{
    id: string;
    name: string;
    status?: ProjectStatus | null;
    assignedAt?: string | Date | null;
    description?: string | null;
  }>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const ASSET_STATUS_COLORS: Record<string, string> = {
  active: "text-green-600",
  inactive: "text-gray-600",
  maintenance: "text-yellow-600",
  retired: "text-red-600",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: "text-blue-600",
  active: "text-green-600",
  "on-hold": "text-yellow-600",
  completed: "text-gray-600",
  cancelled: "text-red-600",
};

function getStatusColor(
  status: string,
  type: "asset" | "project" = "asset",
): string {
  if (type === "asset") {
    return ASSET_STATUS_COLORS[status] ?? "text-gray-600";
  }

  return PROJECT_STATUS_COLORS[status] ?? "text-gray-600";
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  subtitle?: string;
}

function StatCard({ title, value, icon, subtitle }: StatCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="text-blue-600" aria-hidden>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard(): JSX.Element {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [assets, setAssets] = useState<DashboardAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<DashboardAsset | null>(
    null,
  );
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isAssetDetailsOpen, setIsAssetDetailsOpen] = useState(false);

  const parseProjects = useCallback(
    (projects: AssetsResponse["projects"]): DashboardProject[] => {
      if (!projects) {
        return [];
      }

      return projects.map((project) => {
        const assignedAt = project.assignedAt
          ? typeof project.assignedAt === "string"
            ? project.assignedAt
            : project.assignedAt.toISOString()
          : undefined;

        return {
          id: project.id,
          name: project.name,
          status: project.status ?? "active",
          assignedAt,
          description: project.description ?? undefined,
        };
      });
    },
    [],
  );

  const parseAsset = useCallback(
    (asset: AssetsResponse): DashboardAsset => {
      const createdAt = asset.createdAt
        ? typeof asset.createdAt === "string"
          ? asset.createdAt
          : asset.createdAt.toISOString()
        : new Date().toISOString();

      const updatedAt = asset.updatedAt
        ? typeof asset.updatedAt === "string"
          ? asset.updatedAt
          : asset.updatedAt.toISOString()
        : createdAt;

      return {
        id: asset.id,
        name: asset.name,
        description: asset.description ?? "",
        location: asset.location,
        status: asset.status,
        createdAt,
        updatedAt,
        projects: parseProjects(asset.projects),
      };
    },
    [parseProjects],
  );

  const handleStatsFetch = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await fetch("/api/assets/stats");

      if (!response.ok) {
        throw new Error(`Failed to load stats: ${response.status}`);
      }

      const payload: ApiResponse<Stats> = await response.json();
      setStats(payload.success ? payload.data : null);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleAssetsFetch = useCallback(async () => {
    try {
      const response = await fetch("/api/assets?limit=100");

      if (!response.ok) {
        throw new Error(`Failed to load assets: ${response.status}`);
      }

      const payload: ApiResponse<AssetsResponse[]> = await response.json();

      if (payload.success) {
        setAssets(payload.data.map(parseAsset));
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAssets([]);
    }
  }, [parseAsset]);

  useEffect(() => {
    void handleStatsFetch();
    void handleAssetsFetch();
  }, [handleStatsFetch, handleAssetsFetch]);

  const handleAssetSelection = useCallback((asset: DashboardAsset) => {
    setSelectedAsset(asset);
    setIsAssetDetailsOpen(true);
  }, []);

  const handleProjectManagerClose = useCallback(() => {
    setIsProjectManagerOpen(false);
    void handleStatsFetch();
    void handleAssetsFetch();
  }, [handleStatsFetch, handleAssetsFetch]);

  const closeAssetDetails = useCallback(() => {
    setIsAssetDetailsOpen(false);
    setSelectedAsset(null);
  }, []);

  return (
    <div className="space-y-8">
      {statsLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-lg bg-white p-6 shadow"
            >
              <div className="mb-2 h-4 rounded bg-gray-200" />
              <div className="mb-2 h-8 rounded bg-gray-200" />
              <div className="h-4 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Assets"
            value={stats.summary.totalAssets}
            icon={<BarChart3 className="h-10 w-10" />}
          />
          <StatCard
            title="Total Projects"
            value={stats.summary.totalProjects}
            icon={<ClipboardList className="h-10 w-10" />}
          />
          <StatCard
            title="Assigned Projects"
            value={stats.summary.assignedProjects}
            subtitle={`${stats.summary.assignmentRate}% assignment rate`}
            icon={<Briefcase className="h-10 w-10" />}
          />
          <StatCard
            title="Unassigned Projects"
            value={stats.summary.unassignedProjects}
            icon={<FolderX className="h-10 w-10" />}
          />
        </div>
      ) : null}

      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Asset Locations</h2>
        <AssetMap
          assets={assets}
          // onAssetClick={handleAssetSelection}
          onMapClick={(lat, lng) => {
            console.info("Map clicked at:", { lat, lng });
          }}
          selectedAsset={selectedAsset}
          height="500px"
        />
      </div>

      {stats ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold">Assets by Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.assetsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`mr-3 h-3 w-3 rounded-full ${getStatusColor(status)}`}
                    />
                    <span className="capitalize">{status}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold">Projects by Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.projectsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`mr-3 h-3 w-3 rounded-full ${getStatusColor(status, "project")}`}
                    />
                    <span className="capitalize">
                      {status.replace("-", " ")}
                    </span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {selectedAsset ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-lg font-semibold">Selected Asset</h3>
            <button
              type="button"
              onClick={closeAssetDetails}
              className="text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Clear selection"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <h4 className="mb-2 text-lg font-medium">{selectedAsset.name}</h4>
          <p className="mb-4 text-gray-600">{selectedAsset.description}</p>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <span className="text-sm text-gray-500">Status:</span>
              <p className="font-medium capitalize">{selectedAsset.status}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Location:</span>
              <p className="font-medium">
                {selectedAsset.location.lat.toFixed(4)},{" "}
                {selectedAsset.location.lng.toFixed(4)}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Projects:</span>
              <p className="font-medium">{selectedAsset.projects.length}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsProjectManagerOpen(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Manage Projects
          </button>
        </div>
      ) : null}

      {isProjectManagerOpen && selectedAsset ? (
        <AssetProjectManager
          assetId={selectedAsset.id}
          onClose={handleProjectManagerClose}
        />
      ) : null}

      <AssetDetailsSheet
        asset={selectedAsset}
        isOpen={isAssetDetailsOpen}
        onClose={closeAssetDetails}
        onManageProjects={(assetId) => {
          setIsAssetDetailsOpen(false);
          setIsProjectManagerOpen(true);
          void handleStatsFetch();
          void handleAssetsFetch();
        }}
      />
    </div>
  );
}
