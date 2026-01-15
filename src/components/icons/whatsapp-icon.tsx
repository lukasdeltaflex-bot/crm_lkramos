'use client';
import { cn } from '@/lib/utils';

export const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('h-5 w-5', className)}
  >
    <defs>
      <linearGradient id="wa-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#25D366' }} />
        <stop offset="100%" style={{ stopColor: '#128C7E' }} />
      </linearGradient>
    </defs>
    <path
      fill="url(#wa-gradient)"
      d="M16.75,13.96C17.41,15.64 16.36,17.25 14.7,17.82C14.13,18.03 12.3,18.5 10.55,17.75C8.8,17 7.17,15.47 7.17,15.47L7.12,15.42C6.08,14.38 5.4,13.06 5.4,11.64C5.4,8.93 7.55,6.78 10.26,6.78C11.56,6.78 12.8,7.27 13.77,8.24L13.82,8.29C14.52,8.99 15.31,10.84 15.31,10.84C15.31,10.84 15.54,10.13 15.31,9.42C15.08,8.71 14.52,8.31 14.17,8.19C13.81,8.08 13.38,8.08 13.07,8.31C12.76,8.54 12.06,9.25 12.06,9.25C11.19,10.12 11.42,11.2 11.42,11.2C11.65,11.91 12.35,12.22 12.35,12.22C13.23,12.57 14.02,11.77 14.25,11.31C14.48,10.84 14.25,10.13 14.25,10.13C14.25,10.13 15.77,12.94 16.75,13.96Z"
      transform="translate(1.5, 1.5)"
    />
    <path
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
    />
  </svg>
);