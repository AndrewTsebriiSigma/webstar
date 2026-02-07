'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PrivacyPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to settings page with privacy section
    router.replace('/settings');
  }, [router]);

  return null;
}
