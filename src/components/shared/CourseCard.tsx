import { Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Course } from '@/lib/types';

interface CourseCardProps {
  course: Course;
  progress?: number;
  lessonCount?: number;
  href: string;
}

export function CourseCard({ course, progress, lessonCount, href }: CourseCardProps) {
  return (
    <Card className="group overflow-hidden border-border/60 transition-all duration-300 hover:shadow-lg">
      <Link to={href} className="block">
        <div className="relative flex h-32 items-center justify-center bg-navy text-cream">
          <BookOpen className="h-10 w-10 opacity-30 transition-opacity group-hover:opacity-50" />
          <Badge className="absolute right-3 top-3 bg-french-red text-white hover:bg-french-red">
            {course.level}
          </Badge>
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-navy">
            {course.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
          {typeof progress === 'number' && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {lessonCount !== undefined ? `${lessonCount} lessons` : course.estimated_duration || 'Flexible'}
            </span>
            <Button variant="ghost" size="sm" className="gap-1 px-2 text-navy hover:text-french-red">
              View
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  );
}
