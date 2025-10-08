"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

import { FormActions } from "./fields";
import {
  assetFormSchema,
  getInitialFormValues,
  statusOptions,
  type AssetFormAsset,
  type AssetFormValues,
  type AssetSubmitPayload,
} from "./schema";
import {
  AssetDetailsSection,
  AuctionSaleSection,
  LocationSection,
  PropertyInformationSection,
  StatusSection,
} from "./sections";
import type { FormErrors } from "./types";

interface AssetFormProps {
  asset?: AssetFormAsset;
  onSubmit: (data: AssetSubmitPayload) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const FORM_WRAPPER_CLASS =
  "max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg space-y-8";

export default function AssetForm({
  asset,
  onSubmit,
  onCancel,
  isLoading = false,
}: AssetFormProps) {
  const [formData, setFormData] = useState<AssetFormValues>(() =>
    getInitialFormValues(asset),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setFormData(getInitialFormValues(asset));
  }, [asset]);

  const handleFieldChange = (field: keyof AssetFormValues, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const handleLocationChange = (axis: "lat" | "lng", value: string) => {
    setFormData((previous) => ({
      ...previous,
      location: {
        ...previous.location,
        [axis]: value,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    try {
      const validated = assetFormSchema.parse(formData);
      const payload: AssetSubmitPayload = {
        ...validated,
        carStatus: validated.carStatus?.trim()
          ? validated.carStatus
          : undefined,
      };

      await onSubmit(payload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(extractErrors(error));
      }
    }
  };

  const handleLocationClick = () => {
    const latInput = prompt("Enter latitude (-90 to 90):");
    const lngInput = prompt("Enter longitude (-180 to 180):");

    if (!latInput || !lngInput) {
      return;
    }

    const latitude = Number(latInput);
    const longitude = Number(lngInput);

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      alert(
        "Invalid coordinates. Please ensure latitude is between -90 and 90, and longitude is between -180 and 180.",
      );
      return;
    }

    setFormData((previous) => ({
      ...previous,
      location: {
        lat: latInput.trim(),
        lng: lngInput.trim(),
      },
    }));
  };

  return (
    <div className={FORM_WRAPPER_CLASS}>
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">
          {asset ? "Edit Asset" : "Create New Asset"}
        </h2>
        <p className="text-sm text-gray-600">
          Complete the fields below to {asset ? "update" : "add"} an asset
          record.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <AssetDetailsSection
          values={formData}
          errors={errors}
          disabled={isLoading}
          onFieldChange={handleFieldChange}
        />

        <PropertyInformationSection
          values={formData}
          errors={errors}
          disabled={isLoading}
          onFieldChange={handleFieldChange}
        />

        <AuctionSaleSection
          values={formData}
          errors={errors}
          disabled={isLoading}
          onFieldChange={handleFieldChange}
        />

        <StatusSection
          values={formData}
          errors={errors}
          disabled={isLoading}
          onFieldChange={handleFieldChange}
          options={statusOptions}
        />

        <LocationSection
          values={formData.location}
          errors={errors}
          disabled={isLoading}
          onLocationChange={handleLocationChange}
          onPickLocation={handleLocationClick}
        />

        <FormActions
          isLoading={isLoading}
          isEditing={Boolean(asset)}
          onCancel={onCancel}
        />
      </form>
    </div>
  );
}

function extractErrors(error: z.ZodError): FormErrors {
  return error.issues.reduce<FormErrors>((accumulator, issue) => {
    const key = issue.path.join(".");
    if (!accumulator[key]) {
      accumulator[key] = issue.message;
    }

    return accumulator;
  }, {});
}
