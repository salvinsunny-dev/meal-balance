import React from 'react';
import BottomNav from '@/components/layout/BottomNav';

/** Protected app layout — all dashboard/history/stats/settings pages share this */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
