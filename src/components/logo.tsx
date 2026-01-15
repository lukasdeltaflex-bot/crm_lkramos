'use client';

import { cn } from '@/lib/utils';
import React from 'react';

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
                    .print-logo-text {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        font-size: 16px;
                        font-weight: 600;
                        fill: #000;
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

const PrintLogo = ({ className }: { className?: string }) => (
     <div className={cn('flex items-center gap-4', className)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" className="h-10 w-auto">
             <defs>
                <linearGradient id="print-gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#d4af37' }} />
                    <stop offset="50%" style={{ stopColor: '#ffd700' }} />
                    <stop offset="100%" style={{ stopColor: '#d4af37' }} />
                </linearGradient>
                <linearGradient id="print-blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#4c6a9a' }} />
                    <stop offset="100%" style={{ stopColor: '#2a4a7f' }} />
                </linearGradient>
            </defs>
             {/* L Shape */}
            <path d="M5 5 L 5 25 L 17.5 25 L 17.5 21 L 9 21 L 9 5 Z" fill="url(#print-blue-gradient)" />
            <path d="M5 5 L 6 4 L 9 7 L 9 5 Z" fill="#6b8ac0" />
            <path d="M5 25 L 9 21 L 10 22 L 6 26 Z" fill="#2a4a7f" />

            {/* K Shape */}
            <path d="M22.5 5 L 22.5 25 L 26.5 25 L 26.5 16.5 L 35 25 L 39 22.5 L 30 15 L 39 7.5 L 35 5 L 26.5 13.5 L 26.5 5 Z" fill="url(#print-gold-gradient)" />

            {/* Swoosh */}
            <path d="M0,28 C10,23 30,23 40,28 C37.5,30.5 12.5,30.5 2.5,28 Z" fill="url(#print-blue-gradient)" transform="translate(0, -1)" />
            <path d="M2.5,29 C12.5,24 32.5,24 42.5,29 C40,31.5 15,31.5 5,29 Z" fill="url(#print-gold-gradient)" transform="translate(0, -1)" />
        </svg>
         <div>
            <h1 className="font-bold text-lg text-black">Relatório Financeiro</h1>
            <p className="text-sm text-gray-500">LK RAMOS Gestão de Propostas</p>
         </div>
      </div>
)

export function Logo({ className, forPrinting = false }: { className?: string; forPrinting?: boolean }) {
  if (forPrinting) {
    return <PrintLogo className={className} />;
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
