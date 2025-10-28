"use client";

import { useEffect, useState } from "react";
import CaseForm, { CaseFormCase, CaseFormSubmitData } from "./CaseForm";
import CaseDetailsSheet, {
  CaseRecord,
  AssetSummary,
  ProjectSummary,
} from "./CaseDetailsSheet";

interface CaseItem extends CaseRecord {
  asset?: AssetSummary | null;
  project?: ProjectSummary | null;
}

interface AssetOption {
  id: string;
  name: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface CaseListProps {
  onCaseSelect?: (caseRecord: CaseItem) => void;
  selectedCaseId?: string;
  filterByAssetId?: string;
  filterByProjectId?: string;
}

export default function CaseList({
  onCaseSelect,
  selectedCaseId,
  filterByAssetId,
  filterByProjectId,
}: CaseListProps) {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [activeCase, setActiveCase] = useState<CaseItem | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [assetFilter, setAssetFilter] = useState<string>(filterByAssetId || "");
  const [projectFilter, setProjectFilter] = useState<string>(
    filterByProjectId || "",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [assetOptions, setAssetOptions] = useState<AssetOption[]>([]);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [assetsRes, projectsRes] = await Promise.all([
          fetch("/api/assets?limit=500"),
          fetch("/api/projects?limit=500"),
        ]);

        const [assetsData, projectsData] = await Promise.all([
          assetsRes.json(),
          projectsRes.json(),
        ]);

        if (assetsData?.success && Array.isArray(assetsData.data)) {
          setAssetOptions(
            assetsData.data.map((asset: any) => ({
              id: asset.id as string,
              name: (asset.name as string) ?? "Untitled Asset",
            })),
          );
        }

        if (projectsData?.success && Array.isArray(projectsData.data)) {
          setProjectOptions(
            projectsData.data.map((entry: any) => {
              const project = entry.project ?? entry;
              return {
                id: project.id as string,
                name: (project.name as string) ?? "Untitled Project",
              };
            }),
          );
        }
      } catch (err) {
        console.error("Failed to load filters:", err);
      }
    };

    fetchOptions();
  }, []);

  const fetchCases = async (
    page = 1,
    search = "",
    assetId = "",
    projectId = "",
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      const trimmedSearch = search.trim();
      const trimmedAsset = assetId.trim();
      const trimmedProject = projectId.trim();

      if (trimmedSearch) {
        params.set("search", trimmedSearch);
      }

      if (trimmedAsset) {
        params.set("assetId", trimmedAsset);
      }

      if (trimmedProject) {
        params.set("projectId", trimmedProject);
      }

      const response = await fetch(`/api/cases?${params}`);
      const data = await response.json();

      if (data.success) {
        const items = (data.data ?? []) as CaseItem[];
        setCases(items);
        setTotalPages(data.pagination.pages);
        setCurrentPage(data.pagination.page);
        setActiveCase((prev) => {
          if (!prev) return prev;
          return items.find((item) => item.id === prev.id) ?? null;
        });
      } else {
        setError(data.error || "Failed to fetch cases");
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
      setError("Error fetching cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases(currentPage, searchTerm, assetFilter, projectFilter);
  }, [currentPage, searchTerm, assetFilter, projectFilter]);

  useEffect(() => {
    if (filterByAssetId && filterByAssetId !== assetFilter) {
      setAssetFilter(filterByAssetId);
      setCurrentPage(1);
    }
  }, [filterByAssetId]);

  useEffect(() => {
    if (filterByProjectId && filterByProjectId !== projectFilter) {
      setProjectFilter(filterByProjectId);
      setCurrentPage(1);
    }
  }, [filterByProjectId]);

  const handleCreateCase = async (formData: CaseFormSubmitData) => {
    try {
      setFormLoading(true);
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        fetchCases(currentPage, searchTerm, assetFilter, projectFilter);
      } else {
        throw new Error(data.error || "Failed to create case");
      }
    } catch (err) {
      console.error("Error creating case:", err);
      alert("Failed to create case. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateCase = async (formData: CaseFormSubmitData) => {
    if (!editingCase) return;

    try {
      setFormLoading(true);
      const response = await fetch(`/api/cases/${editingCase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setEditingCase(null);
        setShowForm(false);
        fetchCases(currentPage, searchTerm, assetFilter, projectFilter);
      } else {
        throw new Error(data.error || "Failed to update case");
      }
    } catch (err) {
      console.error("Error updating case:", err);
      alert("Failed to update case. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCase = async (caseRecord: CaseItem) => {
    if (
      !confirm(`Are you sure you want to delete case "${caseRecord.caseNo}"?`)
    ) {
      return;
    }

    if (activeCase?.id === caseRecord.id) {
      setActiveCase(null);
    }

    try {
      const response = await fetch(`/api/cases/${caseRecord.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchCases(currentPage, searchTerm, assetFilter, projectFilter);
      } else {
        throw new Error(data.error || "Failed to delete case");
      }
    } catch (err) {
      console.error("Error deleting case:", err);
      alert("Failed to delete case. Please try again.");
    }
  };

  const handleFormSubmit = async (formData: CaseFormSubmitData) => {
    if (editingCase) {
      await handleUpdateCase(formData);
    } else {
      await handleCreateCase(formData);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "Not set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const casesEmpty = !loading && cases.length === 0;

  if (showForm || editingCase) {
    const draftCase: CaseFormCase | undefined = editingCase
      ? {
          id: editingCase.id,
          rtc: editingCase.rtc,
          caseNo: editingCase.caseNo,
          lastUpdatedAt: editingCase.lastUpdatedAt,
          judge: editingCase.judge ?? undefined,
          details: editingCase.details ?? undefined,
          assetId: editingCase.assetId ?? undefined,
          projectId: editingCase.projectId ?? undefined,
        }
      : undefined;

    return (
      <CaseForm
        caseRecord={draftCase}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingCase(null);
        }}
        isLoading={formLoading}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Case Records</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCase(null);
            setActiveCase(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Case
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="case-search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              id="case-search"
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by case number, RTC, judge..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="asset-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Asset
            </label>
            <select
              id="asset-filter"
              value={assetFilter}
              onChange={(event) => {
                setAssetFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!filterByAssetId}
            >
              <option value="">All</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
              {!assetOptions.some((asset) => asset.id === assetFilter) &&
                assetFilter &&
                assetFilter !== "unassigned" &&
                assetFilter !== "assigned" && (
                  <option value={assetFilter}>
                    Selected Asset ({assetFilter.slice(0, 8)}...)
                  </option>
                )}
              {assetOptions.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="project-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Project
            </label>
            <select
              id="project-filter"
              value={projectFilter}
              onChange={(event) => {
                setProjectFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!filterByProjectId}
            >
              <option value="">All</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
              {!projectOptions.some(
                (project) => project.id === projectFilter,
              ) &&
                projectFilter &&
                projectFilter !== "unassigned" &&
                projectFilter !== "assigned" && (
                  <option value={projectFilter}>
                    Selected Project ({projectFilter.slice(0, 8)}...)
                  </option>
                )}
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                if (!filterByAssetId) {
                  setAssetFilter("");
                }
                if (!filterByProjectId) {
                  setProjectFilter("");
                }
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() =>
              fetchCases(currentPage, searchTerm, assetFilter, projectFilter)
            }
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading cases...</p>
        </div>
      )}

      {!loading && cases.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {cases.map((caseEntry) => (
            <div
              key={caseEntry.id}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedCaseId
                  ? selectedCaseId === caseEntry.id
                    ? "ring-2 ring-blue-500"
                    : ""
                  : activeCase?.id === caseEntry.id
                    ? "ring-2 ring-blue-500"
                    : ""
              }`}
              onClick={() => {
                setActiveCase(caseEntry);
                onCaseSelect?.(caseEntry);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {caseEntry.caseNo}
                  </h3>
                  <p className="text-sm text-gray-500">{caseEntry.rtc}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                  {formatDate(caseEntry.lastUpdatedAt)}
                </span>
              </div>

              {caseEntry.judge && (
                <p className="text-sm text-gray-600 mb-3">
                  Judge:{" "}
                  <span className="font-medium text-gray-800">
                    {caseEntry.judge}
                  </span>
                </p>
              )}

              <div className="space-y-2 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Asset:</span>
                  <span>
                    {caseEntry.asset
                      ? caseEntry.asset.name
                      : caseEntry.assetId
                        ? caseEntry.assetId.slice(0, 8) + "..."
                        : "Unassigned"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Project:</span>
                  <span>
                    {caseEntry.project
                      ? caseEntry.project.name
                      : caseEntry.projectId
                        ? caseEntry.projectId.slice(0, 8) + "..."
                        : "Unassigned"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingCase(caseEntry);
                    setActiveCase(null);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteCase(caseEntry);
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

      {casesEmpty && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">⚖️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No cases found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || assetFilter || projectFilter
              ? "No cases match your current filters."
              : "Get started by creating your first case record."}
          </p>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingCase(null);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Case
          </button>
        </div>
      )}

      {!loading && cases.length > 0 && totalPages > 1 && (
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

      <CaseDetailsSheet
        caseRecord={activeCase}
        isOpen={!!activeCase}
        onClose={() => setActiveCase(null)}
        onEdit={(record) => {
          setEditingCase(record);
          setActiveCase(null);
        }}
      />
    </div>
  );
}
