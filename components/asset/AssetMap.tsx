"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface ProjectSummary {
  id: string;
  name: string;
  assignedAt?: string | Date | null;
  status?: string;
}

interface Asset {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  status: "active" | "inactive" | "maintenance" | "retired";
  projects: ProjectSummary[];
  createdAt?: string;
  updatedAt?: string;
}

interface AssetMapProps {
  assets: Asset[];
  onAssetClick?: (asset: Asset) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedAsset?: Asset | null;
  height?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
const DEFAULT_CENTER: [number, number] = [-74.006, 40.7128];
const DEFAULT_ZOOM = 10;

const statusColors = {
  active: "#10b981", // green
  inactive: "#6b7280", // gray
  maintenance: "#f59e0b", // amber
  retired: "#ef4444", // red
};

export default function AssetMap({
  assets,
  onAssetClick,
  onMapClick,
  selectedAsset,
  height = "400px",
}: AssetMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const markers = useRef<any[]>([]);
  const mapboxglRef = useRef<any>(null);

  // Initialize map - using a more robust approach for timing
  useEffect(() => {
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === "your_mapbox_access_token_here") {
      setMapError("Mapbox token not configured");
      return;
    }

    if (map.current) return; // Prevent multiple initialization

    const initializeMap = async () => {
      try {
        // Wait for container to be available
        if (!mapContainer.current) {
          // Retry after a short delay
          setTimeout(initializeMap, 100);
          return;
        }

        // Dynamic import of mapbox-gl
        const mapboxModule = await import("mapbox-gl");
        const mapboxgl = mapboxModule.default ?? mapboxModule;
        mapboxglRef.current = mapboxgl;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
        });

        map.current.on("load", () => {
          setMapLoaded(true);
        });

        map.current.on("error", (e: any) => {
          console.error("Map error:", e);
          setMapError("Failed to load map");
        });

        map.current.on("click", (e: any) => {
          const { lng, lat } = e.lngLat;
          onMapClick?.(lat, lng);
        });
      } catch (error) {
        console.error("Failed to initialize map:", error);
        setMapError("Failed to load Mapbox");
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(initializeMap, 50);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [MAPBOX_TOKEN]);

  // Add assets as markers
  const addAssetsToMap = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    const mapboxgl = mapboxglRef.current;
    if (!mapboxgl) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    assets.forEach((asset) => {
      // Create marker element
      const el = document.createElement("div");
      el.className = "mapbox-asset-marker";
      el.style.cssText = `
        width: 20px;
        height: 20px;
        background-color: ${statusColors[asset.status]};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;

      if (selectedAsset?.id === asset.id) {
        el.style.cssText += `
          width: 24px;
          height: 24px;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0,0,0,0.3);
        `;
      }

      el.addEventListener("mouseenter", () => {
        el.style.boxShadow =
          "0 0 0 2px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(0,0,0,0.4)";
      });

      el.addEventListener("mouseleave", () => {
        if (selectedAsset?.id === asset.id) {
          el.style.boxShadow =
            "0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0,0,0,0.3)";
        } else {
          el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        }
      });

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onAssetClick?.(asset);
      });

      const projectNames = asset.projects
        .map((project) => project.name)
        .filter(Boolean);

      const popupRoot = document.createElement("div");
      popupRoot.style.padding = "10px";
      popupRoot.style.minWidth = "200px";

      const title = document.createElement("h3");
      title.style.margin = "0 0 8px 0";
      title.style.fontWeight = "600";
      title.style.color = "#1f2937";
      title.textContent = asset.name;
      popupRoot.appendChild(title);

      const description = document.createElement("p");
      description.style.margin = "0 0 8px 0";
      description.style.fontSize = "14px";
      description.style.color = "#6b7280";
      description.textContent = asset.description;
      popupRoot.appendChild(description);

      const statusRow = document.createElement("div");
      statusRow.style.display = "flex";
      statusRow.style.alignItems = "center";
      statusRow.style.gap = "8px";
      statusRow.style.marginBottom = "8px";

      const statusIndicator = document.createElement("div");
      statusIndicator.style.width = "12px";
      statusIndicator.style.height = "12px";
      statusIndicator.style.borderRadius = "50%";
      statusIndicator.style.backgroundColor = statusColors[asset.status];
      statusRow.appendChild(statusIndicator);

      const statusLabel = document.createElement("span");
      statusLabel.style.fontSize = "14px";
      statusLabel.style.fontWeight = "500";
      statusLabel.style.textTransform = "capitalize";
      statusLabel.textContent = asset.status;
      statusRow.appendChild(statusLabel);

      popupRoot.appendChild(statusRow);

      if (projectNames.length > 0) {
        const projectsWrapper = document.createElement("div");

        const projectsHeading = document.createElement("p");
        projectsHeading.style.margin = "0 0 4px 0";
        projectsHeading.style.fontSize = "12px";
        projectsHeading.style.fontWeight = "500";
        projectsHeading.style.color = "#374151";
        projectsHeading.textContent = "Ongoing Projects:";
        projectsWrapper.appendChild(projectsHeading);

        const projectsList = document.createElement("ul");
        projectsList.style.margin = "0";
        projectsList.style.paddingLeft = "16px";
        projectsList.style.fontSize = "12px";
        projectsList.style.color = "#6b7280";

        projectNames.forEach((project) => {
          const listItem = document.createElement("li");
          listItem.style.marginBottom = "2px";
          listItem.textContent = project;
          projectsList.appendChild(listItem);
        });

        projectsWrapper.appendChild(projectsList);
        popupRoot.appendChild(projectsWrapper);
      }

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
      }).setDOMContent(popupRoot);

      // Create marker using the simple constructor
      const marker = new mapboxgl.Marker(el)
        .setLngLat([asset.location.lng, asset.location.lat])
        .setPopup(popup)
        .addTo(map.current);

      markers.current.push(marker);
    });
  }, [assets, mapLoaded, selectedAsset, onAssetClick]);

  const fitMapToAssets = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    const mapboxgl = mapboxglRef.current;
    if (!mapboxgl) return;

    if (assets.length === 0) {
      map.current.flyTo({
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        duration: 600,
        essential: true,
      });
      return;
    }

    if (assets.length === 1) {
      const { lat, lng } = assets[0].location;
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 600,
        essential: true,
      });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    assets.forEach((asset) => {
      bounds.extend([asset.location.lng, asset.location.lat]);
    });

    map.current.fitBounds(bounds, {
      padding: 80,
      duration: 800,
      maxZoom: 14,
    });
  }, [assets, mapLoaded]);

  // Update markers when assets or selection changes
  useEffect(() => {
    if (mapLoaded) {
      addAssetsToMap();
      fitMapToAssets();
    }
  }, [addAssetsToMap, fitMapToAssets, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    if (selectedAsset) {
      map.current.flyTo({
        center: [selectedAsset.location.lng, selectedAsset.location.lat],
        zoom: 14,
        duration: 600,
        essential: true,
      });
    } else {
      fitMapToAssets();
    }
  }, [selectedAsset, mapLoaded, fitMapToAssets]);

  if (
    mapError ||
    !MAPBOX_TOKEN ||
    MAPBOX_TOKEN === "your_mapbox_access_token_here"
  ) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height }}
      >
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Mapbox Configuration Required
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>To enable the map view, please:</p>
            <ol className="text-left list-decimal list-inside space-y-1">
              <li>
                Get a free Mapbox access token from{" "}
                <a
                  href="https://www.mapbox.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  mapbox.com
                </a>
              </li>
              <li>
                Create a{" "}
                <code className="bg-gray-200 px-1 rounded">.env.local</code>{" "}
                file
              </li>
              <li>
                Add:{" "}
                <code className="bg-gray-200 px-1 rounded">
                  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token
                </code>
              </li>
              <li>Restart the development server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="relative rounded-lg overflow-hidden">
      <div
        ref={mapContainer}
        className="map-container"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Legend - only show when map is loaded */}
      {mapLoaded && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
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
      )}

      {/* Asset count - only show when map is loaded */}
      {mapLoaded && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 z-10">
          <span className="text-sm font-medium">{assets.length} assets</span>
        </div>
      )}
    </div>
  );
}
