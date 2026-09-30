import { Link } from 'react-router-dom';
import { Check, Lock, Clock, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface LessonCardProps {
  title: string;
  durationMinutes: number;
  order: number;
  completed: boolean;
  locked?: boolean;
  href?: string;
}

export function LessonCard({ title, durationMinutes, order, completed, locked, href }: LessonCardProps) {
  const content = (
    <div
      className={cn(
        'group flex items-center gap-4 rounded-lg border border-border/50 p-4 transition-all duration-200',
        completed && 'bg-cream',
        !completed && !locked && 'bg-card hover:border-navy/20 hover:shadow-sm',
        locked && 'bg-muted/30 opacity-60',
        href && !locked && 'cursor-pointer'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          completed
            ? 'border-navy bg-navy text-cream'
            : locked
            ? 'border-muted bg-muted/50 text-muted-foreground'
            : 'border-border text-muted-foreground group-hover:border-navy group-hover:text-navy'
        )}
      >
        {completed ? (
          <Check className="h-5 w-5" />
        ) : locked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <PlayCircle className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Lesson {order}</span>
          {completed && (
            <Badge variant="secondary" className="bg-navy/10 text-navy">
              Completed
            </Badge>
          )}
        </div>
        <h4
          className={cn(
            'truncate text-sm font-medium',
            completed ? 'text-foreground' : 'text-foreground',
            locked && 'text-muted-foreground'
          )}
        >
          {title}
        </h4>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {durationMinutes}m
      </div>
    </div>
  );

  if (href && !locked) {
    return <Link to={href}>{content}</Link>;
  }
  return content;
}
