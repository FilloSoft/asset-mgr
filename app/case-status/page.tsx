'use client';

import DashboardNav from '@/components/DashboardNav';
import CaseStatusList from '@/components/CaseStatusList';

export default function CaseStatusPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <DashboardNav />
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <CaseStatusList />
      </div>
    </div>
  );
}

