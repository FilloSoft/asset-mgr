'use client';

import DashboardNav from "@/components/DashboardNav";
import ProjectList from "@/components/ProjectList";

export default function ProjectPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProjectList />
      </div>
    </div>
  );
}
