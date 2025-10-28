"use client";

import { useState, useEffect } from "react";
import AssetForm from "./AssetForm";

interface Asset {
  id: string;
  name: string;
  description: string;
  taxDecNo: string;
  declaredOwner: string;
  marketValue: string;
  assessedValue: string;
  carStatus?: string;
  address: string;
  taxDeclarationNo: string;
  tctNo: string;
  areaPerSqM: string;
  locationOfPropery: string;
  barangay: string;
  bidder: string;
  entryNo: string;
  detailsShortUpdateLog: string;
  auctionDate: string;
  dateOfCertificationOfSale: string;
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

interface AssetListProps {
  onAssetSelect?: (asset: Asset) => void;
  selectedAssetId?: string;
}

export default function AssetList({
  onAssetSelect,
  selectedAssetId,
}: AssetListProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAssets = async (page = 1, search = "", status = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(status && { status }),
      });

      const response = await fetch(`/api/assets?${params}`);
      const data = await response.json();

      if (data.success) {
        setAssets(data.data);
        setTotalPages(data.pagination.pages);
        setCurrentPage(data.pagination.page);
      } else {
        setError(data.error || "Failed to fetch assets");
      }
    } catch (err) {
      setError("Error fetching assets");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter]);

  const handleCreateAsset = async (formData: any) => {
    try {
      setFormLoading(true);
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        fetchAssets(currentPage, searchTerm, statusFilter);
      } else {
        throw new Error(data.error || "Failed to create asset");
      }
    } catch (err) {
      console.error("Error creating asset:", err);
      alert("Failed to create asset. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateAsset = async (formData: any) => {
    if (!editingAsset) return;

    try {
      setFormLoading(true);
      const response = await fetch(`/api/assets/${editingAsset.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setEditingAsset(null);
        fetchAssets(currentPage, searchTerm, statusFilter);
      } else {
        throw new Error(data.error || "Failed to update asset");
      }
    } catch (err) {
      console.error("Error updating asset:", err);
      alert("Failed to update asset. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAsset = async (asset: Asset) => {
    if (
      !confirm(
        `Are you sure you want to delete "${asset.name}"? This will unassign all related projects.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchAssets(currentPage, searchTerm, statusFilter);
      } else {
        throw new Error(data.error || "Failed to delete asset");
      }
    } catch (err) {
      console.error("Error deleting asset:", err);
      alert("Failed to delete asset. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "retired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (showForm || editingAsset) {
    return (
      <AssetForm
        asset={editingAsset || undefined}
        onSubmit={editingAsset ? handleUpdateAsset : handleCreateAsset}
        onCancel={() => {
          setShowForm(false);
          setEditingAsset(null);
        }}
        isLoading={formLoading}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Asset
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search assets..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => fetchAssets(currentPage, searchTerm, statusFilter)}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading assets...</p>
        </div>
      )}

      {/* Assets Grid */}
      {!loading && assets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedAssetId === asset.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => onAssetSelect?.(asset)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {asset.name}
                </h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}
                >
                  {asset.status}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {asset.description}
              </p>

              <div className="text-xs text-gray-500 mb-3">
                📍 {asset.location.lat.toFixed(4)},{" "}
                {asset.location.lng.toFixed(4)}
              </div>

              <div className="text-xs text-gray-500 mb-4">
                🏗️ {asset.projects.length} project
                {asset.projects.length !== 1 ? "s" : ""}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAsset(asset);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAsset(asset);
                  }}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && assets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No assets found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter
              ? "No assets match your current filters."
              : "Get started by creating your first asset."}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Asset
          </button>
        </div>
      )}

      {/* Pagination */}
      {!loading && assets.length > 0 && totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
