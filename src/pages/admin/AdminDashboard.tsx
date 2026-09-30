import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Video, Calendar, ArrowRight, TrendingUp, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Profile, Course, Module, Lesson, ClassSession, LessonProgress, QuizAttempt, Quiz } from '@/lib/types';

interface AdminData {
  stats: { studentCount: number; courseCount: number; lessonCount: number; upcomingClassCount: number };
  courses: (Course & { studentCount: number; moduleCount: number; lessonCount: number; avgProgress: number })[];
  upcomingClasses: (ClassSession & { course: Course | null })[];
  recentActivity: { type: string; text: string; sub: string }[];
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    const { count: courseCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
    const { count: lessonCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true });

    const today = new Date().toISOString().split('T')[0];
    const { count: upcomingClassCount } = await supabase.from('classes').select('*', { count: 'exact', head: true }).gte('class_date', today);

    const { data: courses } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    const courseIds = (courses || []).map((c) => c.id);

    const { data: enrollments } = await supabase.from('enrollments').select('course_id, student_id').in('course_id', courseIds);
    const { data: modules } = await supabase.from('modules').select('*').in('course_id', courseIds);
    const moduleIds = (modules || []).map((m) => m.id);
    const { data: lessons } = await supabase.from('lessons').select('*').in('module_id', moduleIds);
    const lessonIds = (lessons || []).map((l) => l.id);
    const { data: progress } = await supabase.from('lesson_progress').select('*').in('lesson_id', lessonIds).eq('completed', true);

    const coursesWithStats = (courses || []).map((c: Course) => {
      const cModuleIds = (modules || []).filter((m: Module) => m.course_id === c.id).map((m) => m.id);
      const cLessons = (lessons || []).filter((l: Lesson) => cModuleIds.includes(l.module_id));
      const cEnrollments = (enrollments || []).filter((e) => e.course_id === c.id);
      const cLessonIds = cLessons.map((l) => l.id);
      const cProgress = (progress || []).filter((p: LessonProgress) => cLessonIds.includes(p.lesson_id));
      const avgProgress = cEnrollments.length > 0 && cLessons.length > 0
        ? Math.round((cProgress.length / (cEnrollments.length * cLessons.length)) * 100)
        : 0;
      return {
        ...c,
        studentCount: cEnrollments.length,
        moduleCount: cModuleIds.length,
        lessonCount: cLessons.length,
        avgProgress,
      };
    });

    const { data: upcomingData } = await supabase
      .from('classes')
      .select('*, course:courses(*)')
      .gte('class_date', today)
      .order('class_date', { ascending: true })
      .limit(5);

    // Recent activity: latest lesson completions and quiz attempts
    const { data: recentProgress } = await supabase
      .from('lesson_progress')
      .select('*, student:profiles(full_name), lesson:lessons(title)')
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(3);

    const { data: recentAttempts } = await supabase
      .from('quiz_attempts')
      .select('*, student:profiles(full_name), quiz:quizzes(title)')
      .order('completed_at', { ascending: false })
      .limit(3);

    const activity: { type: string; text: string; sub: string }[] = [];
    (recentProgress || []).forEach((p: any) => {
      activity.push({
        type: 'lesson',
        text: `${p.student?.full_name || 'Student'} completed:`,
        sub: p.lesson?.title || 'Lesson',
      });
    });
    (recentAttempts || []).forEach((a: any) => {
      activity.push({
        type: 'quiz',
        text: `${a.student?.full_name || 'Student'} scored ${a.score}/${a.total} in`,
        sub: a.quiz?.title || 'Quiz',
      });
    });

    setData({
      stats: {
        studentCount: studentCount || 0,
        courseCount: courseCount || 0,
        lessonCount: lessonCount || 0,
        upcomingClassCount: upcomingClassCount || 0,
      },
      courses: coursesWithStats,
      upcomingClasses: (upcomingData || []) as (ClassSession & { course: Course | null })[],
      recentActivity: activity.slice(0, 5),
    });
    setLoading(false);
  }

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Bonjour, Teacher</h1>
        <p className="mt-1 text-muted-foreground">Manage your courses, students, and classes.</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox icon={Users} label="Total Students" value={data?.stats.studentCount ?? 0} />
        <StatBox icon={BookOpen} label="Active Courses" value={data?.stats.courseCount ?? 0} />
        <StatBox icon={Video} label="Lessons" value={data?.stats.lessonCount ?? 0} />
        <StatBox icon={Calendar} label="Upcoming Classes" value={data?.stats.upcomingClassCount ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-4">
                {data?.recentActivity.map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${act.type === 'lesson' ? 'bg-navy/5 text-navy' : 'bg-french-red/10 text-french-red'}`}>
                      {act.type === 'lesson' ? <TrendingUp className="h-4 w-4" /> : <Award className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{act.text}</p>
                      <p className="text-sm font-medium text-muted-foreground">"{act.sub}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">Upcoming Classes</CardTitle>
              <Link to="/admin/classes">
                <Button variant="ghost" size="sm" className="gap-1 text-navy">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.upcomingClasses.length === 0 ? (
              <EmptyState icon={Calendar} title="No upcoming classes" className="py-8" />
            ) : (
              <div className="space-y-3">
                {data?.upcomingClasses.map((cls) => (
                  <div key={cls.id} className="rounded-lg border border-border/40 p-3">
                    <p className="text-sm font-medium text-foreground">{cls.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(cls.class_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {cls.start_time.slice(0, 5)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Course Overview */}
      <Card className="mt-6 border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-lg">Course Overview</CardTitle>
            <Link to="/admin/courses">
              <Button variant="ghost" size="sm" className="gap-1 text-navy">
                Manage Courses <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data?.courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses yet" description="Create your first course to get started." className="py-8" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Course</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Students</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Modules</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Lessons</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Avg Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.courses.map((c) => (
                    <tr key={c.id} className="border-b border-border/30 last:border-0">
                      <td className="py-3">
                        <Link to={`/admin/courses/${c.id}`} className="font-medium text-foreground hover:text-french-red">
                          {c.title}
                        </Link>
                        <Badge className="ml-2 bg-french-red/10 text-french-red">{c.level}</Badge>
                      </td>
                      <td className="py-3 text-center text-foreground">{c.studentCount}</td>
                      <td className="py-3 text-center text-foreground">{c.moduleCount}</td>
                      <td className="py-3 text-center text-foreground">{c.lessonCount}</td>
                      <td className="py-3 text-center font-medium text-navy">{c.avgProgress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card className="border-border/60">
      <CardContent className="pt-6">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5 text-navy">
          <Icon className="h-5 w-5" />
        </div>
        <p className="font-display text-3xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
