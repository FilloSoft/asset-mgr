"use client";

import { ClipboardCheck, ClipboardX, FolderOpen, Package } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import AssetDetailsSheet from "./AssetDetailsSheet";
import AssetMap from "./AssetMap";
import AssetProjectManager from "./AssetProjectManager";
import "mapbox-gl/dist/mapbox-gl.css";

interface Asset {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  status: "active" | "inactive" | "maintenance" | "retired";
  projects: Array<{
    id: string;
    name: string;
    status: string;
    assignedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  summary: {
    totalAssets: number;
    totalProjects: number;
    assignedProjects: number;
    unassignedProjects: number;
    assignmentRate: number;
  };
  assetsByStatus: Record<string, number>;
  projectsByStatus: Record<string, number>;
}

const getStatusColor = (
  status: string,
  type: "asset" | "project" = "asset",
) => {
  if (type === "asset") {
    switch (status) {
      case "active":
        return "text-green-600";
      case "inactive":
        return "text-gray-600";
      case "maintenance":
        return "text-yellow-600";
      case "retired":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  }

  switch (status) {
    case "planning":
      return "text-blue-600";
    case "active":
      return "text-green-600";
    case "on-hold":
      return "text-yellow-600";
    case "completed":
      return "text-gray-600";
    case "cancelled":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: ReactNode;
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="text-blue-600" aria-hidden>
        {icon}
      </div>
    </div>
  </div>
);

export default function AssetsOverview() {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showAssetDetails, setShowAssetDetails] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await fetch("/api/assets/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      const response = await fetch("/api/assets?limit=100");
      const data = await response.json();

      if (data.success) {
        setAssets(data.data);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
    void fetchAssets();
  }, [fetchStats, fetchAssets]);

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetDetails(true);
  };

  const handleMapClick = (lat: number, lng: number) => {
    console.log("Map clicked at:", { lat, lng });
  };

  return (
    <>
      <div className="space-y-8">
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-8 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Assets"
              value={stats.summary.totalAssets}
              icon={<Package className="h-8 w-8" />}
            />
            <StatCard
              title="Total Projects"
              value={stats.summary.totalProjects}
              icon={<FolderOpen className="h-8 w-8" />}
            />
            <StatCard
              title="Assigned Projects"
              value={stats.summary.assignedProjects}
              subtitle={`${stats.summary.assignmentRate}% assignment rate`}
              icon={<ClipboardCheck className="h-8 w-8" />}
            />
            <StatCard
              title="Unassigned Projects"
              value={stats.summary.unassignedProjects}
              icon={<ClipboardX className="h-8 w-8" />}
            />
          </div>
        ) : null}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Asset Locations</h2>
          <AssetMap
            assets={assets}
            onAssetClick={(asset) => {
              const dashboardAsset: Asset = {
                ...asset,
                createdAt: asset.createdAt || new Date().toISOString(),
                updatedAt: asset.updatedAt || new Date().toISOString(),
                projects: (asset.projects || []).map((project) => ({
                  id: project.id,
                  name: project.name,
                  status: project.status || "active",
                  assignedAt:
                    project.assignedAt == null
                      ? undefined
                      : typeof project.assignedAt === "string"
                        ? project.assignedAt
                        : project.assignedAt.toISOString(),
                })),
              };

              handleAssetClick(dashboardAsset);
            }}
            onMapClick={handleMapClick}
            selectedAsset={selectedAsset}
            height="500px"
          />
        </div>

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Assets by Status</h3>
              <div className="space-y-3">
                {Object.entries(stats.assetsByStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(status)}`}
                      />
                      <span className="capitalize">{status}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Projects by Status</h3>
              <div className="space-y-3">
                {Object.entries(stats.projectsByStatus).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(status, "project")}`}
                        />
                        <span className="capitalize">
                          {status.replace("-", " ")}
                        </span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {selectedAsset && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Selected Asset</h3>
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                X
              </button>
            </div>

            <h4 className="font-medium text-lg mb-2">{selectedAsset.name}</h4>
            <p className="text-gray-600 mb-4">{selectedAsset.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              onClick={() => setShowProjectManager(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Projects
            </button>
          </div>
        )}
      </div>

      {showProjectManager && selectedAsset && (
        <AssetProjectManager
          assetId={selectedAsset.id}
          onClose={() => {
            setShowProjectManager(false);
            void fetchStats();
            void fetchAssets();
          }}
        />
      )}

      <AssetDetailsSheet
        asset={selectedAsset}
        isOpen={showAssetDetails}
        onClose={() => {
          setShowAssetDetails(false);
          setSelectedAsset(null);
        }}
        onManageProjects={() => {
          setShowAssetDetails(false);
          setShowProjectManager(true);
        }}
      />
    </>
  );
}

