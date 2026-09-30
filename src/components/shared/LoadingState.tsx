import { cn } from '@/lib/utils';

interface LoadingStateProps {
  text?: string;
  className?: string;
}

export function LoadingState({ text = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-xl border bg-card p-6 shadow-sm', className)}>
      <div className="mb-4 h-32 rounded-lg bg-muted" />
      <div className="mb-3 h-4 w-3/4 rounded bg-muted" />
      <div className="mb-2 h-3 w-1/2 rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

export function RowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 py-4', className)}>
      <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
