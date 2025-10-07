'use client';

import { useState, useEffect } from 'react';

interface Asset {
  id: string;
  name: string;
  status: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface Project {
  id: string;
  name: string;
  status: string;
  taxDecNo: string;
  declaredOwner: string;
  assetId?: string;
  assignedAt?: string;
}

interface AssetProjectManagerProps {
  assetId: string;
  onClose: () => void;
}

export default function AssetProjectManager({ assetId, onClose }: AssetProjectManagerProps) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [assetId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch asset details and assigned projects
      const [assetResponse, assignedResponse, availableResponse] = await Promise.all([
        fetch(`/api/assets/${assetId}`),
        fetch(`/api/assets/${assetId}/projects`),
        fetch('/api/projects?assetId=unassigned&limit=100')
      ]);

      const assetData = await assetResponse.json();
      const assignedData = await assignedResponse.json();
      const availableData = await availableResponse.json();

      if (assetData.success) {
        setAsset(assetData.data);
        setAssignedProjects(assetData.data.projects || []);
      } else {
        setError(assetData.error || 'Failed to fetch asset');
      }

      if (assignedData.success) {
        setAssignedProjects(assignedData.data);
      }

      if (availableData.success) {
        setAvailableProjects(availableData.data);
      }
    } catch (err) {
      setError('Error fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const assignProject = async (projectId: string) => {
    try {
      setActionLoading(projectId);
      const response = await fetch(`/api/assets/${assetId}/projects/${projectId}`, {
        method: 'PUT',
      });

      const data = await response.json();

      if (data.success) {
        await fetchData(); // Refresh data
      } else {
        throw new Error(data.error || 'Failed to assign project');
      }
    } catch (err) {
      console.error('Error assigning project:', err);
      alert('Failed to assign project. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const unassignProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to unassign this project from the asset?')) {
      return;
    }

    try {
      setActionLoading(projectId);
      const response = await fetch(`/api/assets/${assetId}/projects/${projectId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchData(); // Refresh data
      } else {
        throw new Error(data.error || 'Failed to unassign project');
      }
    } catch (err) {
      console.error('Error unassigning project:', err);
      alert('Failed to unassign project. Please try again.');
    } finally {
      setActionLoading(null);
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Asset Projects</h2>
            {asset && (
              <p className="text-gray-600 mt-1">
                {asset.name} • {assignedProjects.length} assigned project{assignedProjects.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Assigned Projects */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Assigned Projects ({assignedProjects.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {assignedProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p>No projects assigned to this asset</p>
                  </div>
                ) : (
                  assignedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 truncate pr-2">{project.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(project.status)}`}>
                          {project.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <div>Tax Dec: {project.taxDecNo}</div>
                        <div>Owner: {project.declaredOwner}</div>
                        {project.assignedAt && (
                          <div>Assigned: {formatDate(project.assignedAt)}</div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => unassignProject(project.id)}
                          disabled={actionLoading === project.id}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === project.id ? 'Removing...' : 'Unassign'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Projects */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Projects ({availableProjects.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">✅</div>
                    <p>All projects are assigned</p>
                  </div>
                ) : (
                  availableProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 truncate pr-2">{project.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(project.status)}`}>
                          {project.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <div>Tax Dec: {project.taxDecNo}</div>
                        <div>Owner: {project.declaredOwner}</div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => assignProject(project.id)}
                          disabled={actionLoading === project.id}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === project.id ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}