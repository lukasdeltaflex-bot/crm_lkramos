'use client';

import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Customer } from '@/lib/types';
import { BirthdayCalendar } from '@/components/customers/birthday-calendar';
import { Skeleton } from '@/components/ui/skeleton';

export default function BirthdaysPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const { data: customers, isLoading } = useCollection<Customer>(customersQuery);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Central de Aniversariantes" />
        
        {isLoading ? (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-[600px] w-full rounded-[2rem]" />
            </div>
        ) : (
            <BirthdayCalendar customers={customers || []} />
        )}
      </div>
    </AppLayout>
  );
}
