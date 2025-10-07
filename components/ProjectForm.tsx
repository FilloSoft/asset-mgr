'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';

// Project form validation schema
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').trim(),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']).default('planning'),
  assetId: z.string().uuid('Invalid asset ID').optional().nullable(),
  startDate: z.union([
    z.string().datetime('Invalid date format').transform(str => new Date(str)),
    z.date(),
    z.null()
  ]).optional(),
  endDate: z.union([
    z.string().datetime('Invalid date format').transform(str => new Date(str)),
    z.date(),
    z.null()
  ]).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Asset {
  id: string;
  name: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  assetId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  asset?: Asset;
}

interface ProjectFormProps {
  project?: Project;
  preselectedAssetId?: string;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProjectForm({ 
  project, 
  preselectedAssetId, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ProjectFormProps) {
  const [formData, setFormData] = useState<Partial<ProjectFormData>>({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'planning',
    assetId: project?.assetId || preselectedAssetId || null,
    startDate: project?.startDate ? new Date(project.startDate) : null,
    endDate: project?.endDate ? new Date(project.endDate) : null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Fetch available assets for assignment
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoadingAssets(true);
        const response = await fetch('/api/assets?limit=100'); // Get more assets for selection
        const data = await response.json();
        
        if (data.success) {
          setAssets(data.data);
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Convert dates to ISO strings for validation
      const dataToValidate = {
        ...formData,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null,
      };

      const validatedData = projectSchema.parse(dataToValidate);
      await onSubmit(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          fieldErrors[path] = issue.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value ? new Date(value) : null
    }));
  };

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return new Date(date).toISOString().split('T')[0];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {project ? 'Edit Project' : 'Create New Project'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter project name"
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Project Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status || 'planning'}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project description"
            disabled={isLoading}
          />
        </div>

        {/* Asset Assignment */}
        <div>
          <label htmlFor="assetId" className="block text-sm font-medium text-gray-700 mb-2">
            Assigned Asset
          </label>
          <select
            id="assetId"
            value={formData.assetId || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, assetId: e.target.value || null }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || loadingAssets}
          >
            <option value="">No Asset Assigned</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.status})
              </option>
            ))}
          </select>
          {loadingAssets && <p className="mt-1 text-sm text-gray-500">Loading assets...</p>}
        </div>

        {/* Timeline */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={formatDateForInput(formData.startDate)}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={formatDateForInput(formData.endDate)}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              <span>{project ? 'Update Project' : 'Create Project'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}