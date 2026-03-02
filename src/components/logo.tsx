'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserSettings } from '@/lib/types';

const LogoSvg = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 80"
      className={cn("h-10 w-auto", className)}
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
                        font-size: 16px;
                        font-weight: 600;
                        fill: hsl(var(--sidebar-foreground));
                    }
                `}
            </style>
        </defs>

        {/* L Shape */}
        <path
            d="M30 10 L 30 50 L 55 50 L 55 42 L 38 42 L 38 10 Z"
            fill="url(#blue-gradient)"
        />
        <path
            d="M30 10 L 32 8 L 38 14 L 38 10 Z"
            fill="#6b8ac0"
        />
        <path
            d="M30 50 L 38 42 L 40 44 L 32 52 Z"
            fill="#2a4a7f"
        />

        {/* K Shape */}
        <path
            d="M65 10 L 65 50 L 73 50 L 73 33 L 90 50 L 98 45 L 80 30 L 98 15 L 90 10 L 73 27 L 73 10 Z"
            fill="url(#gold-gradient)"
        />

        {/* Swoosh */}
        <path
            d="M20,60 C40,50 80,50 100,60 C95,65 45,65 25,60 Z"
            fill="url(#blue-gradient)"
            transform="translate(0, -2)"
        />
        <path
            d="M25,62 C45,52 85,52 105,62 C100,67 50,67 30,62 Z"
            fill="url(#gold-gradient)"
            transform="translate(0, -2)"
        />

        {/* Text */}
        <text x="30" y="70" className="logo-text" dominantBaseline="middle" textAnchor="start">LK RAMOS</text>
    </svg>
);

export function Logo({ className, forPrinting = false }: { className?: string; forPrinting?: boolean }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'userSettings', user.uid) : null, [user, firestore]);
  const { data: settings } = useDoc<UserSettings>(settingsRef);

  if (settings?.customLogoURL) {
    return (
        <div className={cn(
            'flex items-center justify-center transition-all duration-500 overflow-hidden',
            forPrinting ? 'h-16 w-auto' : 'h-14 w-full p-2 group-data-[collapsible=icon]:p-1',
            className
        )}>
            <img 
                src={settings.customLogoURL} 
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
        'flex items-center group-data-[collapsible=icon]:gap-0',
        className
      )}
    >
      <LogoSvg className="h-12 w-full group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-full"/>
    </div>
  );
}
