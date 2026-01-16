
'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { DailySummary } from '@/components/summary/daily-summary';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Proposal, Customer, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SummaryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
  }, [firestore, user]);
  
  const userProfileDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);


  const { data: proposals, isLoading: proposalsLoading } = useCollection<Proposal>(proposalsQuery);
  const { data: customers, isLoading: customersLoading } = useCollection<Customer>(customersQuery);
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileDocRef);

  const isLoading = proposalsLoading || customersLoading || isUserLoading || profileLoading;

  return (
    <AppLayout>
      <PageHeader title="Resumo Diário" />
      {isLoading ? (
        <div className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <DailySummary 
            proposals={proposals || []}
            customers={customers || []}
            userProfile={userProfile}
        />
      )}
    </AppLayout>
  );
}
