'use client';

import React from 'react';
import { AppLayout } from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from './profile-form';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { updateEmail } from 'firebase/auth';

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileDocRef);
    
    const handleProfileUpdate = async (data: Partial<UserProfile>) => {
        if (!user || !userProfileDocRef) return;

        // Check if email is being changed
        if (data.email && data.email !== user.email) {
            try {
                // First, try to update the sensitive auth email
                await updateEmail(user, data.email);
            } catch (error: any) {
                console.error("Error updating email:", error);
                let description = 'Ocorreu um erro ao tentar atualizar seu e-mail. Nenhuma informação foi salva.';
                if (error.code === 'auth/requires-recent-login') {
                    description = 'Para alterar seu e-mail, você precisa fazer login novamente. Por segurança, nenhuma outra informação foi alterada.';
                } else if (error.code === 'auth/email-already-in-use') {
                    description = 'Este e-mail já está em uso por outra conta. Nenhuma informação foi alterada.';
                }
                toast({
                    variant: 'destructive',
                    title: 'Falha na atualização do e-mail',
                    description: description,
                });
                return; // IMPORTANT: Stop execution to prevent partial update
            }
        }
        
        // If email update was successful (or not needed), update Firestore
        setDocumentNonBlocking(userProfileDocRef, data, { merge: true });
        toast({
            title: 'Perfil Atualizado!',
            description: 'Suas informações foram salvas com sucesso.',
        });
    };

    const isLoading = isUserLoading || isProfileLoading;

    return (
        <AppLayout>
            <PageHeader title="Meu Perfil" />
            <Card>
                <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>
                        Gerencie suas informações pessoais e como você é exibido no sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <Skeleton className="h-24 w-24 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </div>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                         </div>
                    ) : (
                        <ProfileForm userProfile={userProfile} onSubmit={handleProfileUpdate} />
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
