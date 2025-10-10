'use client';

import { FormEvent, useMemo, useState } from 'react';

type CaseStatusPayload = {
  rtc: string;
  case_no: string;
  lastUpdatedAt: string;
  judge?: string;
  details?: string;
};

interface CaseStatusFormProps {
  initialValues?: Partial<CaseStatusPayload>;
  onSubmit: (payload: CaseStatusPayload) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

function toDatetimeLocal(value?: string): string {
  if (!value) {
    return new Date().toISOString().slice(0, 16);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16);
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function CaseStatusForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save Case Status',
  isSubmitting = false,
}: CaseStatusFormProps) {
  const [rtc, setRtc] = useState(initialValues?.rtc ?? '');
  const [caseNo, setCaseNo] = useState(initialValues?.case_no ?? '');
  const [judge, setJudge] = useState(initialValues?.judge ?? '');
  const [details, setDetails] = useState(initialValues?.details ?? '');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(
    toDatetimeLocal(initialValues?.lastUpdatedAt),
  );

  const isSubmitDisabled = useMemo(() => {
    return rtc.trim().length === 0 || caseNo.trim().length === 0 || isSubmitting;
  }, [rtc, caseNo, isSubmitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: CaseStatusPayload = {
      rtc: rtc.trim(),
      case_no: caseNo.trim(),
      lastUpdatedAt: new Date(lastUpdatedAt).toISOString(),
      ...(judge.trim() ? { judge: judge.trim() } : {}),
      ...(details.trim() ? { details: details.trim() } : {}),
    };

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-6 rounded-lg bg-white p-6 shadow'
    >
      <div>
        <h2 className='text-xl font-semibold text-gray-900'>
          {initialValues ? 'Edit Case Status' : 'New Case Status'}
        </h2>
        <p className='mt-2 text-sm text-gray-600'>
          Provide case details and the latest update timestamp.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <label className='flex flex-col gap-2'>
          <span className='text-sm font-medium text-gray-700'>RTC *</span>
          <input
            type='text'
            value={rtc}
            onChange={(event) => setRtc(event.target.value)}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
            placeholder='Regional Trial Court'
            required
          />
        </label>
        <label className='flex flex-col gap-2'>
          <span className='text-sm font-medium text-gray-700'>Case Number *</span>
          <input
            type='text'
            value={caseNo}
            onChange={(event) => setCaseNo(event.target.value)}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
            placeholder='Case number'
            required
          />
        </label>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <label className='flex flex-col gap-2'>
          <span className='text-sm font-medium text-gray-700'>Judge</span>
          <input
            type='text'
            value={judge}
            onChange={(event) => setJudge(event.target.value)}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
            placeholder='Presiding judge'
          />
        </label>
        <label className='flex flex-col gap-2'>
          <span className='text-sm font-medium text-gray-700'>Last Updated *</span>
          <input
            type='datetime-local'
            value={lastUpdatedAt}
            onChange={(event) => setLastUpdatedAt(event.target.value)}
            className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
            required
          />
        </label>
      </div>

      <label className='flex flex-col gap-2'>
        <span className='text-sm font-medium text-gray-700'>Details</span>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          rows={4}
          className='rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
          placeholder='Current status, notes, or next actions'
        />
      </label>

      <div className='flex items-center justify-end gap-3'>
        <button
          type='button'
          onClick={onCancel}
          className='rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100'
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type='submit'
          className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300'
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}



