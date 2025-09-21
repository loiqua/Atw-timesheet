"use client";
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type UserProfile } from '@/lib/auth-store';
import { apiGet } from '@/lib/fetcher';

export function useRequireAuth() {
  const router = useRouter();
  const { user, accessToken, loadFromStorage, setUser } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      loadFromStorage();
      try {
        if (!accessToken) {
          router.replace('/auth/login');
          return;
        }
        if (!user) {
          const profile = await apiGet<UserProfile>('/auth/profile', { auth: true });
          setUser(profile);
        }
      } finally {
        setLoading(false);
      }
    })().catch(() => {
      setLoading(false);
      router.replace('/auth/login');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user: useAuthStore.getState().user, loading } as const;
}
