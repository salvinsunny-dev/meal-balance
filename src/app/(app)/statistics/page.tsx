'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Statistics route is now Insights — redirect transparently */
export default function StatisticsPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/insights'); }, [router]);
  return null;
}
