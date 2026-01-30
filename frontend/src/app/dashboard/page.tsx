'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <p className="text-lg">歡迎, <span className="font-semibold">{user.name}</span> ({user.studentId})</p>
        <p className="text-gray-600">科系: {user.department} | 角色: {user.role}</p>
      </div>

      <Button onClick={() => {
        logout();
        router.push('/login');
      }} variant="outline">
        登出
      </Button>
    </div>
  );
}
