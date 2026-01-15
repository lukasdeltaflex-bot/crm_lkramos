'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait for user status to be resolved
    }
    if (!user) {
      router.replace('/login'); // Redirect if not logged in
    } else if (!user.emailVerified) {
        // Redirect to verification page if email is not verified
        router.replace(`/verify-email?email=${user.email}`);
    }
  }, [user, isUserLoading, router]);

  // Show loader while checking auth status or if user is not valid for this route
  if (isUserLoading || !user || !user.emailVerified) {
    return <FullPageLoader />;
  }

  // If user is authenticated and verified, render the protected content
  return <>{children}</>;
}
