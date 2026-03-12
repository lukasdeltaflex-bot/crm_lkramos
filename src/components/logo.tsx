'use client';

import { cn, getSafeStorageUrl } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserSettings } from '@/lib/types';

const LogoSvg = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 80"
      className={cn("h-20 w-auto", className)}
      aria-label="LK Ramos Logo"
    >
        <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#d4af37' }} />
                <stop offset="50%" style={{ stopColor: '#ffd700' }} />
                <stop offset="100%" style={{ stopColor: '#d4af37' }} />
            </linearGradient>
            <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#4c6a9a' }} />
                <stop offset="100%" style={{ stopColor: '#2a4a7f' }} />
            </linearGradient>
            <style>
                {`
                    .logo-text {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        font-size: 20px;
                        font-weight: 900;
                        letter-spacing: -0.02em;
                        fill: hsl(var(--sidebar-foreground));
                    }
                `}
            </style>
        </defs>

        {/* L Shape */}
        <path
            d="M30 5 L 30 45 L 55 45 L 55 37 L 38 37 L 38 5 Z"
            fill="url(#blue-gradient)"
        />
        {/* K Shape */}
        <path
            d="M65 5 L 65 45 L 73 45 L 73 28 L 90 45 L 98 40 L 80 25 L 98 10 L 90 5 L 73 22 L 73 5 Z"
            fill="url(#gold-gradient)"
        />

        {/* Swoosh */}
        <path
            d="M20,55 C40,45 80,45 100,55 C95,60 45,60 25,55 Z"
            fill="url(#blue-gradient)"
        />
        <path
            d="M25,57 C45,47 85,47 105,57 C100,62 50,62 30,57 Z"
            fill="url(#gold-gradient)"
        />

        {/* Text */}
        <text x="30" y="72" className="logo-text" dominantBaseline="middle" textAnchor="start">LK RAMOS</text>
    </svg>
);

export function Logo({ className, forPrinting = false }: { className?: string; forPrinting?: boolean }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const settingsRef = useMemoFirebase(() => 
    user && firestore ? doc(firestore, 'userSettings', user.uid) : null, 
    [user, firestore]
  );
  
  const { data: settings, isLoading } = useDoc<UserSettings>(settingsRef);

  if (!hasMounted || isLoading) {
    return (
        <div className={cn(
            'flex items-center justify-center',
            forPrinting ? 'h-20 w-auto' : 'h-24 w-full p-1 group-data-[collapsible=icon]:p-1',
            className
        )}>
            <div className="w-full h-full bg-transparent" />
        </div>
    );
  }

  if (settings?.customLogoURL) {
    return (
        <div className={cn(
            'flex items-center justify-center transition-all duration-500 overflow-hidden animate-in fade-in duration-300',
            forPrinting ? 'h-20 w-auto' : 'h-24 w-full p-1 group-data-[collapsible=icon]:p-1',
            className
        )}>
            <img 
                src={getSafeStorageUrl(settings.customLogoURL)} 
                alt="Logo Personalizada" 
                className={cn(
                    "max-h-full max-w-full object-contain drop-shadow-sm",
                    forPrinting && "brightness-100 contrast-100"
                )}
            />
        </div>
    )
  }
  
  return (
    <div
      className={cn(
        'flex items-center group-data-[collapsible=icon]:gap-0 animate-in fade-in duration-300 h-24',
        className
      )}
    >
      <LogoSvg className="h-20 w-full group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:w-full"/>
    </div>
  );
}
