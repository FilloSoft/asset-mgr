'use client';

import Dashboard from "@/components/Dashboard";
import DashboardNav from "@/components/DashboardNav";
import "mapbox-gl/dist/mapbox-gl.css";

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
      </div>
    </div>
  );
}
