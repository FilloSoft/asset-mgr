'use client';

import { useState, useEffect } from 'react';

interface BulkOperationsProps {
  type: 'assets' | 'projects';
  selectedItems: string[];
  onOperationComplete: () => void;
  onClose: () => void;
}

export default function BulkOperations({ type, selectedItems, onOperationComplete, onClose }: BulkOperationsProps) {
  const [operation, setOperation] = useState<'delete' | 'update' | ''>('');
  const [loading, setLoading] = useState(false);
  const [updateData, setUpdateData] = useState<Record<string, any>>({});

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} ${type}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const endpoint = type === 'assets' ? '/api/assets/bulk' : '/api/projects';
      const response = await fetch(`${endpoint}?ids=${selectedItems.join(',')}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully deleted ${data.data.length} ${type}`);
        onOperationComplete();
        onClose();
      } else {
        throw new Error(data.error || `Failed to delete ${type}`);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'assets' ? '/api/assets' : '/api/projects';
      
      const payload = {
        [type]: selectedItems.map(id => ({
          id,
          ...updateData,
        }))
      };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully updated ${data.data.length} ${type}`);
        onOperationComplete();
        onClose();
      } else {
        throw new Error(data.error || `Failed to update ${type}`);
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      alert(`Failed to update ${type}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Bulk Operations ({selectedItems.length} {type})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {!operation && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Choose an operation to perform on {selectedItems.length} selected {type}:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setOperation('update')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Bulk Update
              </button>
              <button
                onClick={() => setOperation('delete')}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Bulk Delete
              </button>
            </div>
          </div>
        )}

        {operation === 'update' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Update Properties</h3>
            
            {type === 'assets' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={updateData.status || ''}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep current status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Declaration Number
                  </label>
                  <input
                    type="text"
                    value={updateData.taxDecNo || ''}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, taxDecNo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tax declaration number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Declared Owner
                  </label>
                  <input
                    type="text"
                    value={updateData.declaredOwner || ''}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, declaredOwner: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter declared owner"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market Value
                  </label>
                  <input
                    type="text"
                    value={updateData.marketValue || ''}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, marketValue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter market value"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assessed Value
                  </label>
                  <input
                    type="text"
                    value={updateData.assessedValue || ''}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, assessedValue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter assessed value"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CAR Status
                  </label>
                  <input
                    type="text"
                    value={updateData.carStatus || ''}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, carStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter CAR status"
                  />
                </div>
              </div>
            )}

            {type === 'projects' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={updateData.status || ''}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep current status</option>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={() => setOperation('')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={loading || Object.keys(updateData).length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update All'}
              </button>
            </div>
          </div>
        )}

        {operation === 'delete' && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-800 font-medium">Warning</span>
              </div>
              <p className="text-red-700 mt-2">
                This will permanently delete {selectedItems.length} {type}. This action cannot be undone.
                {type === 'assets' && ' All associated projects will be unassigned.'}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={() => setOperation('')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}