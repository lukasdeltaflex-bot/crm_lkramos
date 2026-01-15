import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-lg font-bold',
        className
      )}
    >
      <div className="bg-primary text-primary-foreground p-2 rounded-md">
        <Landmark className="h-5 w-5" />
      </div>
      <span className="text-xl">LKRAMOS</span>
    </div>
  );
}
