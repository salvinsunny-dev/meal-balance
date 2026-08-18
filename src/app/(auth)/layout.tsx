import React from 'react';

/** Centered auth layout — works on both mobile and desktop */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      {/* Logo / brand mark */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-600 shadow-lg mb-3">
          <span className="text-2xl">🍽️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">MealBalance</h1>
        <p className="text-sm text-gray-500 mt-1">Track meals. Know your balance.</p>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        {children}
      </div>
    </div>
  );
}
