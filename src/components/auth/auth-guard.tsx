
'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';

const FullPageLoader = () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="space-y-4 w-1/2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    </div>
);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If user data is still loading, don't do anything.
    if (isUserLoading) {
      return;
    }

    // If there is no user, and we're not on an auth page, redirect to login.
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    if (!user && !isAuthPage) {
      router.replace('/login');
    }

    // If there is a user, and they are on an auth page, redirect to dashboard.
    if (user && isAuthPage) {
        router.replace('/');
    }

  }, [user, isUserLoading, router, pathname]);

  // While loading, or if redirecting, show a loader.
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  if (isUserLoading || (!user && !isAuthPage) || (user && isAuthPage)) {
    return <FullPageLoader />;
  }

  // If user is loaded and on the correct page, show the children.
  return <>{children}</>;
}
