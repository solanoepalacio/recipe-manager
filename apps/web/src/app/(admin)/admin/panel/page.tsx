'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPanelRoot() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/panel/households');
  }, [router]);
  return null;
}
