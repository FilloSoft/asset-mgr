"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

const caseSchema = z.object({
  rtc: z.string().min(1, "RTC is required").trim(),
  caseNo: z.string().min(1, "Case number is required").trim(),
  lastUpdatedAt: z
    .union([
      z
        .string()
        .datetime("Invalid date format")
        .transform((value) => new Date(value)),
      z.date(),
    ])
    .transform((value) => (value instanceof Date ? value : new Date(value))),
  judge: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
  details: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
  assetId: z
    .string()
    .uuid("Invalid asset ID")
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  projectId: z
    .string()
    .uuid("Invalid project ID")
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
});

export type CaseFormData = z.infer<typeof caseSchema>;

export interface CaseFormSubmitData {
  rtc: string;
  caseNo: string;
  lastUpdatedAt: string;
  judge?: string;
  details?: string;
  assetId?: string | null;
  projectId?: string | null;
}

interface AssetOption {
  id: string;
  name: string;
}

interface ProjectOption {
  id: string;
  name: string;
  assetId?: string | null;
}

export interface CaseFormCase {
  id: string;
  rtc: string;
  caseNo: string;
  lastUpdatedAt: string;
  judge?: string | null;
  details?: string | null;
  assetId?: string | null;
  projectId?: string | null;
}

interface CaseFormProps {
  caseRecord?: CaseFormCase;
  onSubmit: (data: CaseFormSubmitData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

function formatDateTimeInput(date: Date | null) {
  if (!date) return "";

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function CaseForm({
  caseRecord,
  onSubmit,
  onCancel,
  isLoading = false,
}: CaseFormProps) {
  const [formData, setFormData] = useState<Partial<CaseFormData>>({
    rtc: caseRecord?.rtc ?? "",
    caseNo: caseRecord?.caseNo ?? "",
    judge: caseRecord?.judge ?? "",
    details: caseRecord?.details ?? "",
    assetId: caseRecord?.assetId ?? null,
    projectId: caseRecord?.projectId ?? null,
    lastUpdatedAt: caseRecord?.lastUpdatedAt
      ? new Date(caseRecord.lastUpdatedAt)
      : new Date(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        const [assetsRes, projectsRes] = await Promise.all([
          fetch("/api/assets?limit=500"),
          fetch("/api/projects?limit=500"),
        ]);

        const [assetsData, projectsData] = await Promise.all([
          assetsRes.json(),
          projectsRes.json(),
        ]);

        if (assetsData?.success && Array.isArray(assetsData.data)) {
          setAssets(
            assetsData.data.map((asset: any) => ({
              id: asset.id as string,
              name: (asset.name as string) ?? "Untitled Asset",
            })),
          );
        }

        if (projectsData?.success && Array.isArray(projectsData.data)) {
          setProjects(
            projectsData.data.map((projectItem: any) => ({
              id: projectItem.project?.id ?? projectItem.id ?? "",
              name:
                projectItem.project?.name ??
                projectItem.name ??
                "Untitled Project",
              assetId:
                projectItem.project?.assetId ??
                projectItem.assetId ??
                projectItem.project?.asset?.id ??
                null,
            })),
          );
        }
      } catch (error) {
        console.error("Error loading case options:", error);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (caseRecord) {
      setFormData({
        rtc: caseRecord.rtc ?? "",
        caseNo: caseRecord.caseNo ?? "",
        judge: caseRecord.judge ?? "",
        details: caseRecord.details ?? "",
        assetId: caseRecord.assetId ?? null,
        projectId: caseRecord.projectId ?? null,
        lastUpdatedAt: caseRecord.lastUpdatedAt
          ? new Date(caseRecord.lastUpdatedAt)
          : new Date(),
      });
    }
  }, [caseRecord]);

  const filteredProjects = useMemo(() => {
    if (!formData.assetId) return projects;
    return projects.filter(
      (project) => !project.assetId || project.assetId === formData.assetId,
    );
  }, [formData.assetId, projects]);

  const handleChange = (
    field: keyof CaseFormData,
    value: string | Date | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    try {
      const validated = caseSchema.parse({
        ...formData,
        lastUpdatedAt: formData.lastUpdatedAt
          ? formData.lastUpdatedAt instanceof Date
            ? formData.lastUpdatedAt
            : new Date(formData.lastUpdatedAt)
          : new Date(),
      });

      const payload: CaseFormSubmitData = {
        rtc: validated.rtc,
        caseNo: validated.caseNo,
        lastUpdatedAt: validated.lastUpdatedAt.toISOString(),
        judge: validated.judge,
        details: validated.details,
        assetId: validated.assetId ?? null,
        projectId: validated.projectId ?? null,
      };

      await onSubmit(payload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const path = issue.path[0];
          if (typeof path === "string") {
            fieldErrors[path] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }

      console.error("Failed to submit case form:", error);
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "Failed to submit case details",
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {caseRecord ? "Update Case" : "Create New Case"}
          </h2>
          <p className="text-sm text-gray-500">
            {caseRecord
              ? "Modify the case details below."
              : "Provide information about the new case record."}
          </p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="rtc"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              RTC <span className="text-red-500">*</span>
            </label>
            <input
              id="rtc"
              type="text"
              value={formData.rtc ?? ""}
              onChange={(event) => handleChange("rtc", event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Regional Trial Court"
              required
            />
            {errors.rtc && (
              <p className="mt-1 text-sm text-red-600">{errors.rtc}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="caseNo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Case Number <span className="text-red-500">*</span>
            </label>
            <input
              id="caseNo"
              type="text"
              value={formData.caseNo ?? ""}
              onChange={(event) => handleChange("caseNo", event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Case reference number"
              required
            />
            {errors.caseNo && (
              <p className="mt-1 text-sm text-red-600">{errors.caseNo}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastUpdatedAt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Updated At <span className="text-red-500">*</span>
            </label>
            <input
              id="lastUpdatedAt"
              type="datetime-local"
              value={formatDateTimeInput(
                formData.lastUpdatedAt instanceof Date
                  ? formData.lastUpdatedAt
                  : formData.lastUpdatedAt
                  ? new Date(formData.lastUpdatedAt)
                  : null,
              )}
              onChange={(event) => {
                handleChange(
                  "lastUpdatedAt",
                  event.target.value ? new Date(event.target.value) : new Date(),
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.lastUpdatedAt && (
              <p className="mt-1 text-sm text-red-600">
                {errors.lastUpdatedAt}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="judge"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Presiding Judge
            </label>
            <input
              id="judge"
              type="text"
              value={formData.judge ?? ""}
              onChange={(event) => handleChange("judge", event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Judge name"
            />
            {errors.judge && (
              <p className="mt-1 text-sm text-red-600">{errors.judge}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="details"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Case Notes
          </label>
          <textarea
            id="details"
            rows={4}
            value={formData.details ?? ""}
            onChange={(event) => handleChange("details", event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional summary or recent updates..."
          />
          {errors.details && (
            <p className="mt-1 text-sm text-red-600">{errors.details}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="assetId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Linked Asset
            </label>
            <select
              id="assetId"
              value={formData.assetId ?? ""}
              onChange={(event) =>
                handleChange(
                  "assetId",
                  event.target.value ? event.target.value : null,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Not linked</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
            {errors.assetId && (
              <p className="mt-1 text-sm text-red-600">{errors.assetId}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="projectId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Linked Project
            </label>
            <select
              id="projectId"
              value={formData.projectId ?? ""}
              onChange={(event) =>
                handleChange(
                  "projectId",
                  event.target.value ? event.target.value : null,
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Not linked</option>
              {filteredProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>
            )}
          </div>
        </div>

        {errors.form && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {errors.form}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || loadingOptions}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : caseRecord ? "Update Case" : "Create Case"}
          </button>
        </div>
      </form>
    </div>
  );
}
