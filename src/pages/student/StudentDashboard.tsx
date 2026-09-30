import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Video, CheckCircle, TrendingUp, ArrowRight, Calendar, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { StudentLayout } from '@/pages/student/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import type { Course, Module, Lesson, ClassSession, LessonProgress, QuizAttempt, Quiz } from '@/lib/types';

interface DashboardData {
  enrolledCourses: (Course & { lessonCount: number; completedCount: number })[];
  upcomingClass: ClassSession | null;
  nextLesson: { lesson: Lesson; module: Module; course: Course } | null;
  recentAttempts: (QuizAttempt & { quiz: Quiz | null })[];
  stats: { lessonsCompleted: number; quizzesCompleted: number; avgProgress: number; classesAttended: number };
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadDashboard();
  }, [profile]);

  async function loadDashboard() {
    if (!profile) return;

    // Get enrollments with courses
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', profile.id);

    if (!enrollments || enrollments.length === 0) {
      setLoading(false);
      return;
    }

    const courseIds = enrollments.map((e) => e.course_id);
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds)
      .eq('status', 'published');

    // Get all modules for these courses
    const { data: modules } = await supabase
      .from('modules')
      .select('*')
      .in('course_id', courseIds)
      .order('order');

    // Get all lessons for these modules
    const moduleIds = (modules || []).map((m) => m.id);
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds)
      .eq('published', true)
      .order('order');

    // Get lesson progress
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('student_id', profile.id)
      .eq('completed', true);

    const completedLessonIds = new Set((progress || []).map((p) => p.lesson_id));

    // Calculate per-course stats
    const enrolledCourses = (courses || []).map((course) => {
      const courseModules = (modules || []).filter((m) => m.course_id === course.id);
      const courseModuleIds = courseModules.map((m) => m.id);
      const courseLessons = (lessons || []).filter((l) => courseModuleIds.includes(l.module_id));
      const completedCount = courseLessons.filter((l) => completedLessonIds.has(l.id)).length;
      return { ...course, lessonCount: courseLessons.length, completedCount };
    });

    // Find next incomplete lesson
    const allLessons = (lessons || []).sort((a, b) => a.order - b.order);
    const nextIncomplete = allLessons.find((l) => !completedLessonIds.has(l.id));
    let nextLesson: DashboardData['nextLesson'] = null;
    if (nextIncomplete) {
      const module = (modules || []).find((m) => m.id === nextIncomplete.module_id);
      const course = enrolledCourses.find((c) => c.id === module?.course_id);
      if (module && course) nextLesson = { lesson: nextIncomplete, module, course };
    }

    // Get upcoming classes
    const today = new Date().toISOString().split('T')[0];
    const { data: upcomingClasses } = await supabase
      .from('classes')
      .select('*')
      .in('course_id', courseIds)
      .gte('class_date', today)
      .order('class_date', { ascending: true })
      .limit(1);

    // Get recent quiz attempts
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*, quiz:quizzes(*)')
      .eq('student_id', profile.id)
      .order('completed_at', { ascending: false })
      .limit(5);

    // Get class attendance count
    const { data: attendance } = await supabase
      .from('class_attendance')
      .select('id')
      .eq('student_id', profile.id)
      .eq('attended', true);

    const totalLessons = allLessons.length;
    const lessonsCompleted = completedLessonIds.size;
    const quizzesCompleted = (attempts || []).length;
    const avgProgress = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

    setData({
      enrolledCourses,
      upcomingClass: upcomingClasses?.[0] || null,
      nextLesson,
      recentAttempts: (attempts || []) as (QuizAttempt & { quiz: Quiz | null })[],
      stats: {
        lessonsCompleted,
        quizzesCompleted,
        avgProgress,
        classesAttended: attendance?.length || 0,
      },
    });
    setLoading(false);
  }

  if (loading) return <StudentLayout><LoadingState /></StudentLayout>;

  const firstName = profile?.full_name?.split(' ')[0] || 'Student';

  return (
    <StudentLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Bonjour, {firstName} <span className="inline-block">👋</span>
        </h1>
        <p className="mt-1 text-muted-foreground">Continue your French journey.</p>
      </div>

      {(!data || data.enrolledCourses.length === 0) ? (
        <EmptyState
          icon={BookOpen}
          title="You haven't enrolled in a course yet."
          description="Once your teacher enrolls you in a course, it will appear here."
        />
      ) : (
        <div className="space-y-6">
          {/* Top cards grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Current Course */}
            {data.enrolledCourses[0] && (
              <Card className="border-border/60">
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Course</p>
                    <CardTitle className="mt-1 font-display text-xl">{data.enrolledCourses[0].title}</CardTitle>
                  </div>
                  <Badge className="bg-french-red text-white">{data.enrolledCourses[0].level}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">
                      {data.enrolledCourses[0].lessonCount > 0
                        ? Math.round((data.enrolledCourses[0].completedCount / data.enrolledCourses[0].lessonCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={data.enrolledCourses[0].lessonCount > 0
                      ? (data.enrolledCourses[0].completedCount / data.enrolledCourses[0].lessonCount) * 100
                      : 0}
                    className="h-2"
                  />
                  <Link to={`/student/courses/${data.enrolledCourses[0].id}`} className="mt-4 block">
                    <Button className="w-full gap-2 bg-navy text-cream hover:bg-navy-light">
                      Continue Learning
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Class */}
            <Card className="border-border/60">
              <CardHeader>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Upcoming Class</p>
                {data.upcomingClass ? (
                  <CardTitle className="mt-1 font-display text-xl">{data.upcomingClass.title}</CardTitle>
                ) : (
                  <CardTitle className="mt-1 font-display text-xl text-muted-foreground">No upcoming classes</CardTitle>
                )}
              </CardHeader>
              <CardContent>
                {data.upcomingClass ? (
                  <>
                    <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(data.upcomingClass.class_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      <span>•</span>
                      {data.upcomingClass.start_time.slice(0, 5)}
                    </div>
                    {data.upcomingClass.meeting_url && (
                      <a href={data.upcomingClass.meeting_url} target="_blank" rel="noopener noreferrer" className="block">
                        <Button className="w-full gap-2 bg-french-red text-white hover:bg-french-red/90">
                          <Video className="h-4 w-4" />
                          Join Class
                        </Button>
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Check back soon for scheduled classes.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Continue Learning + Quiz Results */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Continue Learning */}
            <Card className="border-border/60">
              <CardHeader>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Continue Learning</p>
              </CardHeader>
              <CardContent>
                {data.nextLesson ? (
                  <>
                    <p className="text-sm text-muted-foreground">{data.nextLesson.module.title}</p>
                    <h3 className="mt-1 font-display text-lg font-medium text-foreground">
                      Lesson {data.nextLesson.lesson.order}: {data.nextLesson.lesson.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">{data.nextLesson.course.title}</p>
                    <Link to={`/student/lesson/${data.nextLesson.lesson.id}`} className="mt-4 block">
                      <Button variant="outline" className="w-full gap-2 border-navy/20 hover:bg-navy hover:text-cream">
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <EmptyState icon={CheckCircle} title="All lessons completed!" description="Great job — you've finished all available lessons." className="py-8" />
                )}
              </CardContent>
            </Card>

            {/* Recent Quiz Results */}
            <Card className="border-border/60">
              <CardHeader>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recent Quiz Results</p>
              </CardHeader>
              <CardContent>
                {data.recentAttempts.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentAttempts.slice(0, 3).map((attempt) => (
                      <div key={attempt.id} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${attempt.score / attempt.total >= 0.8 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            <Award className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{attempt.quiz?.title || 'Quiz'}</p>
                            <p className="text-xs text-muted-foreground">{Math.round((attempt.score / attempt.total) * 100)}%</p>
                          </div>
                        </div>
                        <span className="font-display text-lg font-semibold text-foreground">
                          {attempt.score}/{attempt.total}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Award} title="No quizzes yet" description="You haven't completed any quizzes yet." className="py-8" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <Card className="border-border/60">
            <CardHeader>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Course Statistics</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <StatCard icon={CheckCircle} label="Lessons Completed" value={data.stats.lessonsCompleted} />
                <StatCard icon={Award} label="Quizzes Completed" value={data.stats.quizzesCompleted} />
                <StatCard icon={TrendingUp} label="Course Progress" value={`${data.stats.avgProgress}%`} />
                <StatCard icon={Video} label="Classes Attended" value={data.stats.classesAttended} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </StudentLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-navy/5 text-navy">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
