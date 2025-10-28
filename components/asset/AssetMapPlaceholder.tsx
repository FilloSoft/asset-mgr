'use client';

import { useState, useEffect } from 'react';

interface ProjectSummary {
  id: string;
  name: string;
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
}

interface AssetMapProps {
  assets: Asset[];
  onAssetClick?: (asset: Asset) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedAsset?: Asset | null;
  height?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

const statusColors = {
  active: '#10b981',      // green
  inactive: '#6b7280',    // gray
  maintenance: '#f59e0b', // amber
  retired: '#ef4444',     // red
};

export default function AssetMap({
  assets,
  onAssetClick,
  onMapClick,
  selectedAsset,
  height = '400px'
}: AssetMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // Check if mapbox token is available
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'your_mapbox_access_token_here') {
      setMapError('Mapbox token not configured');
      return;
    }

    // Try to load mapbox
    const loadMapbox = async () => {
      try {
        // Just mark as loaded for now since we have a placeholder
        setMapLoaded(true);
      } catch (error) {
        console.error('Failed to load Mapbox:', error);
        setMapError('Failed to load Mapbox');
      }
    };

    loadMapbox();
  }, []);

  if (mapError || !MAPBOX_TOKEN || MAPBOX_TOKEN === 'your_mapbox_access_token_here') {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height }}
      >
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Mapbox Configuration Required</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>To enable the map view, please:</p>
            <ol className="text-left list-decimal list-inside space-y-1">
              <li>Get a free Mapbox access token from <a href="https://www.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mapbox.com</a></li>
              <li>Create a <code className="bg-gray-200 px-1 rounded">.env.local</code> file</li>
              <li>Add: <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token</code></li>
              <li>Restart the development server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // For now, show a placeholder with asset locations
  return (
    <div style={{ height }} className="relative rounded-lg overflow-hidden bg-gray-100 border">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Locations</h3>
          <div className="bg-white rounded-lg shadow p-4 max-w-md">
            <h4 className="font-medium mb-3">Found {assets.length} assets:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {assets.map((asset) => {
                const projectNames = asset.projects.map(project => project.name).filter(Boolean);

                return (
                  <div 
                    key={asset.id} 
                    className={`p-2 rounded border cursor-pointer hover:bg-gray-50 ${
                      selectedAsset?.id === asset.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                    }`}
                    onClick={() => onAssetClick?.(asset)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: statusColors[asset.status] }}
                      />
                      <span className="font-medium text-sm">{asset.name}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {asset.location.lat.toFixed(4)}, {asset.location.lng.toFixed(4)}
                    </div>
                    {projectNames.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {projectNames.length} ongoing project(s)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <h4 className="text-sm font-semibold mb-2">Asset Status</h4>
        <div className="space-y-1">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
