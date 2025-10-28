"use client";

import { useState } from "react";
import AssetDetailsSheet from "@/components/asset/AssetDetailsSheet";
import AssetList from "@/components/asset/AssetList";
import AssetProjectManager from "@/components/asset/AssetProjectManager";

interface Asset {
  id: string;
  name: string;
  description: string;
  taxDecNo: string;
  declaredOwner: string;
  marketValue: string;
  assessedValue: string;
  carStatus?: string;
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

export default function AssetsListPage() {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAssetDetails, setShowAssetDetails] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetDetails(true);
  };

  return (
    <>
      <AssetList
        onAssetSelect={handleAssetSelect}
        selectedAssetId={selectedAsset?.id}
      />

      {showProjectManager && selectedAsset && (
        <AssetProjectManager
          assetId={selectedAsset.id}
          onClose={() => {
            setShowProjectManager(false);
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
