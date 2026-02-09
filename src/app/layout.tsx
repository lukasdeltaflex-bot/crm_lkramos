import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ThemeProvider } from '@/components/theme-provider';
import { InteractionFixer } from '@/components/interaction-fixer';

setDefaultOptions({ locale: ptBR });

export const metadata: Metadata = {
  title: 'LK RAMOS',
  description: 'Gerenciador de propostas e clientes para correspondentes bancários.',
};

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
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
          <InteractionFixer />
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}