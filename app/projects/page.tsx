'use client';

import ProjectList from '@/components/ProjectList';

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <ProjectList />
      </div>
    </div>
  );
}