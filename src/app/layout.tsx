import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ThemeProvider } from '@/components/theme-provider';
import { InteractionFixer } from '@/components/interaction-fixer';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PwaRegister } from '@/components/pwa-register';

setDefaultOptions({ locale: ptBR });

export const metadata: Metadata = {
  title: 'LK RAMOS',
  description: 'Gerenciador de propostas e clientes para correspondentes bancários de elite.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LK RAMOS',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#2a4a7f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/lk-apple/180/180" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background antialiased'
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            <InteractionFixer />
            <PwaRegister />
            <FirebaseClientProvider>
              {children}
            </FirebaseClientProvider>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
