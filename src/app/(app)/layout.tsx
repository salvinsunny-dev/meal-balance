import React from 'react';
import BottomNav from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--bg-base)' }}>
      {children}
      <BottomNav />
    </div>
  );
}
