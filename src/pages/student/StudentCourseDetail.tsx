import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { StudentLayout } from '@/pages/student/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LessonCard } from '@/components/shared/LessonCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import type { Course, Module, Lesson, LessonProgress } from '@/lib/types';

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export default function StudentCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && profile) loadCourseData();
  }, [courseId, profile]);

  async function loadCourseData() {
    if (!courseId || !profile) return;

    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();

    const { data: moduleData } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order');

    const moduleIds = (moduleData || []).map((m) => m.id);
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds)
      .eq('published', true)
      .order('order');

    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('student_id', profile.id)
      .eq('completed', true);

    const completed = new Set((progress || []).map((p: LessonProgress) => p.lesson_id));
    setCompletedIds(completed);

    const modulesWithLessons: ModuleWithLessons[] = (moduleData || []).map((m: Module) => ({
      ...m,
      lessons: (lessonData || []).filter((l: Lesson) => l.module_id === m.id),
    }));

    setCourse(courseData as Course | null);
    setModules(modulesWithLessons);
    setLoading(false);
  }

  if (loading) return <StudentLayout><LoadingState /></StudentLayout>;
  if (!course) return <StudentLayout><EmptyState icon={BookOpen} title="Course not found" /></StudentLayout>;

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => completedIds.has(l.id)).length,
    0
  );
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <StudentLayout>
      <Link to="/student/courses" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <Badge className="bg-french-red text-white">{course.level}</Badge>
          <Badge variant="outline">{course.estimated_duration}</Badge>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">{course.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{course.description}</p>
      </div>

      {/* Progress bar */}
      <Card className="mb-8 border-border/60">
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Overall Progress</span>
            <span className="font-display text-2xl font-bold text-navy">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            {completedLessons} of {totalLessons} lessons completed
          </p>
        </CardContent>
      </Card>

      {/* Modules */}
      {modules.length === 0 ? (
        <EmptyState icon={BookOpen} title="No modules yet" description="Modules will appear here once the teacher adds them." />
      ) : (
        <div className="space-y-8">
          {modules.map((module, index) => (
            <div key={module.id}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-cream">
                  {index + 1}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Module {index + 1}
                  </p>
                  <h2 className="font-display text-xl font-semibold text-foreground">{module.title}</h2>
                </div>
              </div>
              {module.lessons.length === 0 ? (
                <p className="ml-11 text-sm text-muted-foreground">No lessons in this module yet.</p>
              ) : (
                <div className="ml-11 space-y-3">
                  {module.lessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      title={lesson.title}
                      durationMinutes={lesson.duration_minutes}
                      order={lesson.order}
                      completed={completedIds.has(lesson.id)}
                      href={`/student/lesson/${lesson.id}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
