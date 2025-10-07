'use client';

import { useState, useEffect } from 'react';
import AssetList from './AssetList';
import ProjectList from './ProjectList';
import AssetProjectManager from './AssetProjectManager';
import AssetMap from './AssetMap';
import AssetDetailsSheet from './AssetDetailsSheet';

interface Asset {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  projects: Array<{
    id: string;
    name: string;
    status: string;
    assignedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  assetId?: string;
  taxDecNo: string;
  declaredOwner: string;
  marketValue: string;
  assessedValue: string;
  carStatus?: string;
  startDate?: string;
  endDate?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
  asset?: {
    id: string;
    name: string;
    status: string;
  };
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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'projects'>('overview');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showAssetDetails, setShowAssetDetails] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAssets();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/assets/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets?limit=100');
      const data = await response.json();
      
      if (data.success) {
        setAssets(data.data);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setSelectedProject(null);
    setShowAssetDetails(true);
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setSelectedAsset(null);
  };

  const handleMapClick = (lat: number, lng: number) => {
    console.log('Map clicked at:', { lat, lng });
    // Could be used to create new assets at clicked location
  };

  const getStatusColor = (status: string, type: 'asset' | 'project' = 'asset') => {
    if (type === 'asset') {
      switch (status) {
        case 'active': return 'text-green-600';
        case 'inactive': return 'text-gray-600';
        case 'maintenance': return 'text-yellow-600';
        case 'retired': return 'text-red-600';
        default: return 'text-gray-600';
      }
    } else {
      switch (status) {
        case 'planning': return 'text-blue-600';
        case 'active': return 'text-green-600';
        case 'on-hold': return 'text-yellow-600';
        case 'completed': return 'text-gray-600';
        case 'cancelled': return 'text-red-600';
        default: return 'text-gray-600';
      }
    }
  };

  const StatCard = ({ title, value, subtitle, icon }: { title: string; value: number; subtitle?: string; icon: string }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Asset Management Dashboard</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'assets'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Assets
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'projects'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Projects
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Assets"
                  value={stats.summary.totalAssets}
                  icon="🏢"
                />
                <StatCard
                  title="Total Projects"
                  value={stats.summary.totalProjects}
                  icon="🏗️"
                />
                <StatCard
                  title="Assigned Projects"
                  value={stats.summary.assignedProjects}
                  subtitle={`${stats.summary.assignmentRate}% assignment rate`}
                  icon="📋"
                />
                <StatCard
                  title="Unassigned Projects"
                  value={stats.summary.unassignedProjects}
                  icon="📝"
                />
              </div>
            ) : null}

            {/* Map Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Asset Locations</h2>
              <AssetMap
                assets={assets}
                onAssetClick={(asset) => {
                  // Convert AssetMap's asset type to Dashboard's asset type
                  const dashboardAsset: Asset = {
                    ...asset,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    projects: (asset.projects || []).map(p => ({
                      id: p.id,
                      name: p.name,
                      status: 'active',
                      assignedAt: p.assignedAt ? (typeof p.assignedAt === 'string' ? p.assignedAt : p.assignedAt.toISOString()) : undefined
                    }))
                  };
                  handleAssetClick(dashboardAsset);
                }}
                onMapClick={handleMapClick}
                selectedAsset={selectedAsset}
                height="500px"
              />
            </div>

            {/* Status Overview */}
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Asset Status Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Assets by Status</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.assetsByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(status)}`}></div>
                          <span className="capitalize">{status}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Status Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Projects by Status</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.projectsByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(status, 'project')}`}></div>
                          <span className="capitalize">{status.replace('-', ' ')}</span>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Selected Asset/Project Details */}
            {(selectedAsset || selectedProject) && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">
                    {selectedAsset ? 'Selected Asset' : 'Selected Project'}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedAsset(null);
                      setSelectedProject(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                {selectedAsset && (
                  <div>
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
                          {selectedAsset.location.lat.toFixed(4)}, {selectedAsset.location.lng.toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Projects:</span>
                        <p className="font-medium">{selectedAsset.projects.length}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowProjectManager(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Manage Projects
                    </button>
                  </div>
                )}

                {selectedProject && (
                  <div>
                    <h4 className="font-medium text-lg mb-2">{selectedProject.name}</h4>
                    {selectedProject.description && (
                      <p className="text-gray-600 mb-4">{selectedProject.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <p className="font-medium capitalize">{selectedProject.status.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Tax Dec No:</span>
                        <p className="font-medium">{selectedProject.taxDecNo}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Owner:</span>
                        <p className="font-medium">{selectedProject.declaredOwner}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Asset:</span>
                        <p className="font-medium">
                          {selectedProject.asset ? selectedProject.asset.name : 'Unassigned'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <AssetList 
            onAssetSelect={handleAssetClick}
            selectedAssetId={selectedAsset?.id}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectList 
            onProjectSelect={handleProjectClick}
            selectedProjectId={selectedProject?.id}
          />
        )}
      </div>

      {/* Asset Project Manager Modal */}
      {showProjectManager && selectedAsset && (
        <AssetProjectManager
          assetId={selectedAsset.id}
          onClose={() => {
            setShowProjectManager(false);
            fetchStats(); // Refresh stats after changes
            fetchAssets(); // Refresh assets
          }}
        />
      )}

      {/* Asset Details Sheet */}
      <AssetDetailsSheet
        asset={selectedAsset}
        isOpen={showAssetDetails}
        onClose={() => {
          setShowAssetDetails(false);
          setSelectedAsset(null);
        }}
        onManageProjects={(assetId) => {
          setShowAssetDetails(false);
          setShowProjectManager(true);
        }}
      />
    </div>
  );
}