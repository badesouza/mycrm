'use client';

import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ marginLeft: 'var(--sidebar-width, 16rem)' }}>
        {children}
      </main>
    </div>
  );
} 