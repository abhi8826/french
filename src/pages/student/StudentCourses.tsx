import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { StudentLayout } from '@/pages/student/StudentLayout';
import { CourseCard } from '@/components/shared/CourseCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import type { Course, Module, Lesson, LessonProgress } from '@/lib/types';

interface CourseWithProgress extends Course {
  lessonCount: number;
  completedCount: number;
  progress: number;
}

export default function StudentCourses() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadCourses();
  }, [profile]);

  async function loadCourses() {
    if (!profile) return;

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', profile.id);

    if (!enrollments || enrollments.length === 0) {
      setLoading(false);
      return;
    }

    const courseIds = enrollments.map((e) => e.course_id);
    const { data: courseData } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds)
      .eq('status', 'published');

    const { data: modules } = await supabase
      .from('modules')
      .select('*')
      .in('course_id', courseIds)
      .order('order');

    const moduleIds = (modules || []).map((m) => m.id);
    const { data: lessons } = await supabase
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

    const completedIds = new Set((progress || []).map((p: LessonProgress) => p.lesson_id));

    const result: CourseWithProgress[] = (courseData || []).map((course) => {
      const courseModuleIds = (modules || []).filter((m: Module) => m.course_id === course.id).map((m) => m.id);
      const courseLessons = (lessons || []).filter((l: Lesson) => courseModuleIds.includes(l.module_id));
      const completedCount = courseLessons.filter((l) => completedIds.has(l.id)).length;
      const lessonCount = courseLessons.length;
      return {
        ...course,
        lessonCount,
        completedCount,
        progress: lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0,
      };
    });

    setCourses(result);
    setLoading(false);
  }

  if (loading) return <StudentLayout><LoadingState /></StudentLayout>;

  return (
    <StudentLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">My Courses</h1>
        <p className="mt-1 text-muted-foreground">Your enrolled French courses and progress.</p>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="You haven't enrolled in a course yet."
          description="Once your teacher enrolls you in a course, it will appear here."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={course.progress}
              lessonCount={course.lessonCount}
              href={`/student/courses/${course.id}`}
            />
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
