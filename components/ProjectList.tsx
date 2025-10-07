'use client';

import { useState, useEffect } from 'react';
import ProjectForm from './ProjectForm';

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
  carStatus?: string;
  startDate?: string;
  endDate?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
  asset?: Asset;
}

interface ProjectListProps {
  onProjectSelect?: (project: Project) => void;
  selectedProjectId?: string;
  filterByAssetId?: string;
}

export default function ProjectList({ onProjectSelect, selectedProjectId, filterByAssetId }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assetFilter, setAssetFilter] = useState<string>(filterByAssetId || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProjects = async (page = 1, search = '', status = '', assetId = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(status && { status }),
        ...(assetId && { assetId }),
      });

      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json();

      if (data.success) {
        setProjects(data.data);
        setTotalPages(data.pagination.pages);
        setCurrentPage(data.pagination.page);
      } else {
        setError(data.error || 'Failed to fetch projects');
      }
    } catch (err) {
      setError('Error fetching projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(currentPage, searchTerm, statusFilter, assetFilter);
  }, [currentPage, searchTerm, statusFilter, assetFilter]);

  // Update asset filter when prop changes
  useEffect(() => {
    if (filterByAssetId !== assetFilter) {
      setAssetFilter(filterByAssetId || '');
      setCurrentPage(1);
    }
  }, [filterByAssetId]);

  const handleCreateProject = async (formData: any) => {
    try {
      setFormLoading(true);
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        fetchProjects(currentPage, searchTerm, statusFilter, assetFilter);
      } else {
        throw new Error(data.error || 'Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Failed to create project. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateProject = async (formData: any) => {
    if (!editingProject) return;

    try {
      setFormLoading(true);
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setEditingProject(null);
        fetchProjects(currentPage, searchTerm, statusFilter, assetFilter);
      } else {
        throw new Error(data.error || 'Failed to update project');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Failed to update project. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchProjects(currentPage, searchTerm, statusFilter, assetFilter);
      } else {
        throw new Error(data.error || 'Failed to delete project');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (showForm || editingProject) {
    return (
      <ProjectForm
        project={editingProject || undefined}
        preselectedAssetId={filterByAssetId}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        onCancel={() => {
          setShowForm(false);
          setEditingProject(null);
        }}
        isLoading={formLoading}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Projects {filterByAssetId && '(Filtered by Asset)'}
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
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
              placeholder="Search projects..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
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
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label htmlFor="assetFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Asset Assignment
            </label>
            <select
              id="assetFilter"
              value={assetFilter}
              onChange={(e) => {
                setAssetFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!filterByAssetId}
            >
              <option value="">All Projects</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned to Asset</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                if (!filterByAssetId) {
                  setAssetFilter('');
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

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => fetchProjects(currentPage, searchTerm, statusFilter, assetFilter)}
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
          <p className="mt-2 text-gray-600">Loading projects...</p>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedProjectId === project.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onProjectSelect?.(project)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">{project.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(project.status)}`}>
                  {project.status.replace('-', ' ')}
                </span>
              </div>

              {project.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
              )}

              {/* Asset Assignment */}
              <div className="mb-3">
                {project.asset ? (
                  <div className="flex items-center text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                    <span className="mr-1">🏢</span>
                    <span className="truncate">{project.asset.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    <span className="mr-1">📋</span>
                    <span>Unassigned</span>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="text-xs text-gray-500 mb-4">
                <div>📅 Start: {formatDate(project.startDate)}</div>
                <div>🏁 End: {formatDate(project.endDate)}</div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProject(project);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project);
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
      {!loading && projects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏗️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter || assetFilter 
              ? 'No projects match your current filters.' 
              : 'Get started by creating your first project.'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Project
          </button>
        </div>
      )}

      {/* Pagination */}
      {!loading && projects.length > 0 && totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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