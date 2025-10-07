'use client';

import { useState } from 'react';
import { z } from 'zod';

// Asset form validation schema
const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required').trim(),
  description: z.string().min(1, 'Asset description is required').trim(),
  taxDecNo: z.string().min(1, 'Tax declaration number is required').trim(),
  declaredOwner: z.string().min(1, 'Declared owner is required').trim(),
  marketValue: z.string().min(1, 'Market value is required').trim(),
  assessedValue: z.string().min(1, 'Assessed value is required').trim(),
  carStatus: z.string().optional(),
  location: z.object({
    lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
    lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  }),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired']).default('active'),
});

type AssetFormData = z.infer<typeof assetSchema>;

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
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  createdAt: string;
  updatedAt: string;
}

interface AssetFormProps {
  asset?: Asset;
  onSubmit: (data: AssetFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function AssetForm({ asset, onSubmit, onCancel, isLoading = false }: AssetFormProps) {
  const [formData, setFormData] = useState<AssetFormData>({
    name: asset?.name || '',
    description: asset?.description || '',
    taxDecNo: asset?.taxDecNo || '',
    declaredOwner: asset?.declaredOwner || '',
    marketValue: asset?.marketValue || '',
    assessedValue: asset?.assessedValue || '',
    carStatus: asset?.carStatus || '',
    location: {
      lat: asset?.location.lat || 0,
      lng: asset?.location.lng || 0,
    },
    status: asset?.status || 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = assetSchema.parse(formData);
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

  const handleLocationClick = () => {
    // Simple prompt for now - in a real app, you'd integrate with a map picker
    const latStr = prompt('Enter latitude (-90 to 90):');
    const lngStr = prompt('Enter longitude (-180 to 180):');
    
    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setFormData(prev => ({
          ...prev,
          location: { lat, lng }
        }));
        setClickedLocation({ lat, lng });
      } else {
        alert('Invalid coordinates. Please ensure latitude is between -90 and 90, and longitude is between -180 and 180.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {asset ? 'Edit Asset' : 'Create New Asset'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Asset Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter asset name"
            disabled={isLoading}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Asset Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter asset description"
            disabled={isLoading}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Property Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Property Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tax Declaration Number */}
            <div>
              <label htmlFor="taxDecNo" className="block text-sm font-medium text-gray-700 mb-2">
                Tax Declaration Number *
              </label>
              <input
                type="text"
                id="taxDecNo"
                value={formData.taxDecNo}
                onChange={(e) => setFormData(prev => ({ ...prev, taxDecNo: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.taxDecNo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter tax declaration number"
                disabled={isLoading}
              />
              {errors.taxDecNo && <p className="mt-1 text-sm text-red-600">{errors.taxDecNo}</p>}
            </div>

            {/* Declared Owner */}
            <div>
              <label htmlFor="declaredOwner" className="block text-sm font-medium text-gray-700 mb-2">
                Declared Owner *
              </label>
              <input
                type="text"
                id="declaredOwner"
                value={formData.declaredOwner}
                onChange={(e) => setFormData(prev => ({ ...prev, declaredOwner: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.declaredOwner ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter declared owner name"
                disabled={isLoading}
              />
              {errors.declaredOwner && <p className="mt-1 text-sm text-red-600">{errors.declaredOwner}</p>}
            </div>

            {/* Market Value */}
            <div>
              <label htmlFor="marketValue" className="block text-sm font-medium text-gray-700 mb-2">
                Market Value *
              </label>
              <input
                type="text"
                id="marketValue"
                value={formData.marketValue}
                onChange={(e) => setFormData(prev => ({ ...prev, marketValue: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.marketValue ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter market value"
                disabled={isLoading}
              />
              {errors.marketValue && <p className="mt-1 text-sm text-red-600">{errors.marketValue}</p>}
            </div>

            {/* Assessed Value */}
            <div>
              <label htmlFor="assessedValue" className="block text-sm font-medium text-gray-700 mb-2">
                Assessed Value *
              </label>
              <input
                type="text"
                id="assessedValue"
                value={formData.assessedValue}
                onChange={(e) => setFormData(prev => ({ ...prev, assessedValue: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.assessedValue ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter assessed value"
                disabled={isLoading}
              />
              {errors.assessedValue && <p className="mt-1 text-sm text-red-600">{errors.assessedValue}</p>}
            </div>

            {/* CAR Status */}
            <div className="md:col-span-2">
              <label htmlFor="carStatus" className="block text-sm font-medium text-gray-700 mb-2">
                CAR Status
              </label>
              <input
                type="text"
                id="carStatus"
                value={formData.carStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, carStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter CAR status"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Asset Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        {/* Location */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="lat" className="block text-xs font-medium text-gray-600 mb-1">
                Latitude
              </label>
              <input
                type="number"
                id="lat"
                value={formData.location.lat}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, lat: parseFloat(e.target.value) || 0 }
                }))}
                step="any"
                min="-90"
                max="90"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['location.lat'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
                disabled={isLoading}
              />
              {errors['location.lat'] && <p className="mt-1 text-xs text-red-600">{errors['location.lat']}</p>}
            </div>
            <div>
              <label htmlFor="lng" className="block text-xs font-medium text-gray-600 mb-1">
                Longitude
              </label>
              <input
                type="number"
                id="lng"
                value={formData.location.lng}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, lng: parseFloat(e.target.value) || 0 }
                }))}
                step="any"
                min="-180"
                max="180"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['location.lng'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
                disabled={isLoading}
              />
              {errors['location.lng'] && <p className="mt-1 text-xs text-red-600">{errors['location.lng']}</p>}
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleLocationClick}
            className="mt-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isLoading}
          >
            📍 Pick Location
          </button>
          
          {(errors['location.lat'] || errors['location.lng']) && (
            <p className="mt-1 text-sm text-red-600">Please provide valid coordinates</p>
          )}
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
              <span>{asset ? 'Update Asset' : 'Create Asset'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}