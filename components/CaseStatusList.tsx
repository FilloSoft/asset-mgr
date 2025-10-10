'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import CaseStatusForm from './CaseStatusForm';

interface CaseStatusRecord {
  id: string;
  rtc: string;
  case_no: string;
  judge?: string | null;
  details?: string | null;
  lastUpdatedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  error?: string;
  message?: string;
  details?: string[];
}

function formatDateForDisplay(value: string) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CaseStatusList() {
  const [records, setRecords] = useState<CaseStatusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CaseStatusRecord | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchCaseStatuses = useCallback(
    async (pageNumber = 1, term = '') => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pageNumber.toString(),
          limit: '10',
        });

        if (term.trim()) {
          params.set('search', term.trim());
        }

        const response = await fetch(`/api/case-status?${params.toString()}`);
        const payload: ApiResponse<CaseStatusRecord[]> = await response.json();

        if (!payload.success) {
          throw new Error(payload.error || 'Failed to fetch case statuses');
        }

        setRecords(payload.data);
        if (payload.pagination) {
          setPage(payload.pagination.page);
          setPages(payload.pagination.pages);
          setTotal(payload.pagination.total);
        }
      } catch (err) {
        console.error('Error loading case statuses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load case statuses');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchCaseStatuses(page, searchTerm);
  }, [page, searchTerm, fetchCaseStatuses]);

  const resetFormState = useCallback(() => {
    setIsFormOpen(false);
    setEditingRecord(null);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingRecord(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((record: CaseStatusRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (record: CaseStatusRecord) => {
    const confirmation = window.confirm(
      `Delete case ${record.case_no} from ${record.rtc}? This action cannot be undone.`,
    );

    if (!confirmation) {
      return;
    }

    try {
      const response = await fetch(`/api/case-status/${record.id}`, { method: 'DELETE' });
      const payload: ApiResponse<CaseStatusRecord> = await response.json();

      if (!payload.success) {
        throw new Error(payload.error || 'Failed to delete case status');
      }

      void fetchCaseStatuses(page, searchTerm);
    } catch (err) {
      console.error('Error deleting case status:', err);
      window.alert('Failed to delete case status. Please try again.');
    }
  }, [page, searchTerm, fetchCaseStatuses]);

  const handleFormSubmit = useCallback(
    async (formData: {
      rtc: string;
      case_no: string;
      lastUpdatedAt: string;
      judge?: string;
      details?: string;
    }) => {
      try {
        setFormSubmitting(true);
        const endpoint = editingRecord
          ? `/api/case-status/${editingRecord.id}`
          : '/api/case-status';
        const method = editingRecord ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const payload: ApiResponse<CaseStatusRecord> = await response.json();

        if (!payload.success) {
          const details = payload.details?.join(', ');
          throw new Error(payload.error || details || 'Failed to save case status');
        }

        resetFormState();
        void fetchCaseStatuses(editingRecord ? page : 1, searchTerm);
        if (!editingRecord) {
          setPage(1);
        }
      } catch (err) {
        console.error('Error saving case status:', err);
        window.alert(err instanceof Error ? err.message : 'Failed to save case status.');
      } finally {
        setFormSubmitting(false);
      }
    },
    [editingRecord, fetchCaseStatuses, page, resetFormState, searchTerm],
  );

  const handleCancel = useCallback(() => {
    resetFormState();
  }, [resetFormState]);

  const statusSummary = useMemo(() => {
    if (records.length === 0) {
      return 'No case statuses found';
    }

    const latest = records[0];
    return `Showing ${records.length} of ${total} case statuses. Latest update: ${formatDateForDisplay(latest.lastUpdatedAt)}.`;
  }, [records, total]);

  if (isFormOpen) {
    return (
      <CaseStatusForm
        initialValues={editingRecord ?? undefined}
        onSubmit={handleFormSubmit}
        onCancel={handleCancel}
        submitLabel={editingRecord ? 'Update Case Status' : 'Create Case Status'}
        isSubmitting={formSubmitting}
      />
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-2xl font-semibold text-gray-900'>Case Status Records</h2>
          <p className='text-sm text-gray-600'>{statusSummary}</p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <input
            type='search'
            value={searchTerm}
            onChange={(event) => {
              setPage(1);
              setSearchTerm(event.target.value);
            }}
            placeholder='Search by case number, RTC, or judge'
            className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-64'
          />
          <button
            type='button'
            onClick={handleCreate}
            className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700'
          >
            New Case Status
          </button>
        </div>
      </div>

      {error ? (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className='space-y-3 rounded-lg bg-white p-6 shadow'>
          <div className='h-4 w-1/3 animate-pulse rounded bg-gray-200' />
          <div className='h-4 w-2/3 animate-pulse rounded bg-gray-200' />
          <div className='h-4 w-1/2 animate-pulse rounded bg-gray-200' />
        </div>
      ) : records.length === 0 ? (
        <div className='rounded-lg bg-white p-8 text-center shadow'>
          <p className='text-gray-600'>No case status records match your filters.</p>
          <p className='mt-1 text-sm text-gray-500'>Create a new entry to get started.</p>
        </div>
      ) : (
        <div className='overflow-x-auto rounded-lg bg-white shadow'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th scope='col' className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                  RTC
                </th>
                <th scope='col' className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                  Case Number
                </th>
                <th scope='col' className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                  Judge
                </th>
                <th scope='col' className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                  Last Updated
                </th>
                <th scope='col' className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500'>
                  Details
                </th>
                <th scope='col' className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {records.map((record) => (
                <tr key={record.id} className='hover:bg-gray-50'>
                  <td className='whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900'>
                    {record.rtc}
                  </td>
                  <td className='whitespace-nowrap px-4 py-4 text-sm text-gray-900'>
                    {record.case_no}
                  </td>
                  <td className='whitespace-nowrap px-4 py-4 text-sm text-gray-700'>
                    {record.judge ?? 'Not assigned'}
                  </td>
                  <td className='whitespace-nowrap px-4 py-4 text-sm text-gray-700'>
                    {formatDateForDisplay(record.lastUpdatedAt)}
                  </td>
                  <td className='px-4 py-4 text-sm text-gray-700'>
                    {record.details ? (
                      <span className='line-clamp-3 text-gray-600'>{record.details}</span>
                    ) : (
                      <span className='text-gray-400'>No details provided</span>
                    )}
                  </td>
                  <td className='whitespace-nowrap px-4 py-4 text-right text-sm font-medium'>
                    <div className='flex items-center justify-end gap-2'>
                      <button
                        type='button'
                        onClick={() => handleEdit(record)}
                        className='rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-100'
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => handleDelete(record)}
                        className='rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 transition-colors hover:bg-red-50'
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 ? (
        <div className='flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow'>
          <span>
            Page {page} of {pages}
          </span>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className='rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
              disabled={page <= 1}
            >
              Previous
            </button>
            <button
              type='button'
              onClick={() => setPage((current) => Math.min(pages, current + 1))}
              className='rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
              disabled={page >= pages}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

