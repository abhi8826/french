import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Award, Video, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Profile, Course, Module, Lesson, LessonProgress, QuizAttempt, Quiz, ClassAttendance } from '@/lib/types';

interface StudentDetail {
  profile: Profile;
  courses: (Course & { progress: number; lessonCount: number; completedCount: number })[];
  recentAttempts: (QuizAttempt & { quiz: Quiz | null })[];
  attendanceCount: number;
  lessonsCompleted: number;
}

export default function AdminStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) loadStudent();
  }, [studentId]);

  async function loadStudent() {
    if (!studentId) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (!profile) {
      setLoading(false);
      return;
    }

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId);

    const courseIds = (enrollments || []).map((e) => e.course_id);
    const { data: courses } = await supabase.from('courses').select('*').in('id', courseIds);
    const { data: modules } = await supabase.from('modules').select('*').in('course_id', courseIds);
    const moduleIds = (modules || []).map((m) => m.id);
    const { data: lessons } = await supabase.from('lessons').select('*').in('module_id', moduleIds);
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('completed', true);

    const completedIds = new Set((progress || []).map((p: LessonProgress) => p.lesson_id));

    const coursesWithProgress = (courses || []).map((c: Course) => {
      const cModuleIds = (modules || []).filter((m: Module) => m.course_id === c.id).map((m) => m.id);
      const cLessons = (lessons || []).filter((l: Lesson) => cModuleIds.includes(l.module_id));
      const completedCount = cLessons.filter((l) => completedIds.has(l.id)).length;
      return {
        ...c,
        lessonCount: cLessons.length,
        completedCount,
        progress: cLessons.length > 0 ? Math.round((completedCount / cLessons.length) * 100) : 0,
      };
    });

    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*, quiz:quizzes(*)')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false })
      .limit(10);

    const { data: attendance } = await supabase
      .from('class_attendance')
      .select('id')
      .eq('student_id', studentId)
      .eq('attended', true);

    setData({
      profile: profile as Profile,
      courses: coursesWithProgress,
      recentAttempts: (attempts || []) as (QuizAttempt & { quiz: Quiz | null })[],
      attendanceCount: attendance?.length || 0,
      lessonsCompleted: completedIds.size,
    });
    setLoading(false);
  }

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (!data) return <AdminLayout><EmptyState icon={BookOpen} title="Student not found" /></AdminLayout>;

  const { profile, courses, recentAttempts, attendanceCount, lessonsCompleted } = data;

  return (
    <AdminLayout>
      <Link to="/admin/students" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Link>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy font-display text-2xl font-bold text-cream">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{profile.full_name}</h1>
          <p className="text-muted-foreground">{profile.email || '—'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stats */}
        <Card className="border-border/60 lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-display text-lg">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow icon={CheckCircle} label="Lessons Completed" value={lessonsCompleted} />
            <StatRow icon={Award} label="Quizzes Taken" value={recentAttempts.length} />
            <StatRow icon={Video} label="Classes Attended" value={attendanceCount} />
            <StatRow icon={BookOpen} label="Courses Enrolled" value={courses.length} />
          </CardContent>
        </Card>

        {/* Enrolled Courses */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg">Enrolled Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not enrolled in any courses.</p>
              ) : (
                <div className="space-y-4">
                  {courses.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border/40 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{c.title}</span>
                        <span className="text-sm font-semibold text-navy">{c.progress}%</span>
                      </div>
                      <Progress value={c.progress} className="h-1.5" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {c.completedCount} of {c.lessonCount} lessons completed
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quiz Scores */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg">Quiz Scores</CardTitle>
            </CardHeader>
            <CardContent>
              {recentAttempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No quiz attempts yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentAttempts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${a.score / a.total >= 0.8 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{a.quiz?.title || 'Quiz'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className="font-display text-lg font-semibold text-foreground">{a.score}/{a.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatRow({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="font-display text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
