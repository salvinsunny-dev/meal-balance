'use client';

import React from 'react';
import Link from 'next/link';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
}

export default function AppHeader({
  title = 'MealBalance',
  showBack = false,
  rightSlot,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        {showBack ? (
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100"
            aria-label="Back to dashboard"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <span className="font-bold text-gray-900 text-base">{title}</span>
          </div>
        )}

        {rightSlot ?? (
          <Link
            href="/settings"
            className="p-2 -mr-2 rounded-xl text-gray-500 hover:bg-gray-100"
            aria-label="Settings"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        )}
      </div>
    </header>
  );
}
