'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardTab {
  href: string;
  label: string;
}

const tabs: DashboardTab[] = [
  { href: "/overview", label: "Overview" },
  { href: "/assets", label: "Assets" },
  { href: "/project", label: "Projects" },
  { href: "/case-status", label: "Case Status" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Asset Management Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive =
                pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
