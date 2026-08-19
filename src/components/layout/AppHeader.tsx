'use client';

import React from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  rightSlot?: React.ReactNode;
  transparent?: boolean;
}

export default function AppHeader({
  title,
  showBack = false,
  backHref = '/dashboard',
  rightSlot,
  transparent = false,
}: AppHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-30 ${
        transparent
          ? 'bg-transparent'
          : 'bg-white/90 backdrop-blur-md border-b border-gray-100/80 shadow-sm'
      }`}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        {/* Left */}
        {showBack ? (
          <Link
            href={backHref}
            className="flex items-center gap-1.5 p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {title && <span className="text-sm font-semibold text-gray-800">{title}</span>}
          </Link>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <span className="text-base">🍽️</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">{APP_NAME}</p>
            </div>
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-1">
          {rightSlot ?? (
            <Link
              href="/settings"
              className="p-2 -mr-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Profile & Settings"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
