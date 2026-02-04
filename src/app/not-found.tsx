'use client';

/**
 * 📌 PÁGINA 404 ESTÁTICA
 * Obrigatório ser 100% independente do Firebase para o Build passar.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-10 text-center">
      <div className="space-y-4">
        <h1 className="text-6xl font-black text-primary/20">404</h1>
        <h2 className="text-2xl font-bold tracking-tight">Página não encontrada</h2>
        <p className="text-muted-foreground max-w-xs mx-auto text-sm">
          O registro ou a página que você está procurando não existe ou foi movida.
        </p>
        <div className="pt-6">
            <a 
                href="/" 
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
                Voltar para o Dashboard
            </a>
        </div>
      </div>
    </div>
  );
}
