
'use client';
import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { DailySummary } from '@/components/summary/daily-summary';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, doc, getDocs, getDoc } from 'firebase/firestore';
import type { Proposal, Customer, UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SummaryPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isLoadingMain, setIsLoadingMain] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    const loadSummaryData = async () => {
        if (!firestore || !user) return;
        setIsLoadingMain(true);
        try {
            const pQ = query(collection(firestore, 'loanProposals'), where('ownerId', '==', user.uid));
            const cQ = query(collection(firestore, 'customers'), where('ownerId', '==', user.uid));
            const uRef = doc(firestore, 'users', user.uid);
            
            const [pSnap, cSnap, uSnap] = await Promise.all([
                getDocs(pQ), getDocs(cQ), getDoc(uRef)
            ]);
            
            if (isMounted) {
                setProposals(pSnap.docs.map(d => ({ ...d.data(), id: d.id } as Proposal)));
                setCustomers(cSnap.docs.map(d => ({ ...d.data(), id: d.id } as Customer)));
                if (uSnap.exists()) {
                    setUserProfile({ ...uSnap.data(), uid: uSnap.id } as UserProfile);
                }
            }
        } catch (e) {
            console.error("Erro ao carregar resumo", e);
        } finally {
            if (isMounted) setIsLoadingMain(false);
        }
    };
    loadSummaryData();
    return () => { isMounted = false; };
  }, [firestore, user]);

  const isLoading = isLoadingMain || isUserLoading;

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
