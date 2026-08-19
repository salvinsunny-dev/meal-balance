import React from 'react';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
         style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #fdf4ff 100%)' }}>

      {/* Brand mark */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-indigo-600 shadow-lg shadow-indigo-200 mb-4">
          <span className="text-3xl">🍽️</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900">{APP_NAME}</h1>
        <p className="text-sm text-gray-400 mt-1">{APP_TAGLINE}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-indigo-100/50 border border-white p-7">
        {children}
      </div>
    </div>
  );
}
