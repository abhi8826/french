import { useEffect, useState } from 'react';
import { User, Mail, BookOpen, CheckCircle, Award, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { StudentLayout } from '@/pages/student/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/shared/LoadingState';
import { toast } from '@/hooks/use-toast';
import type { Course, Module, Lesson, LessonProgress, QuizAttempt, Quiz, ClassAttendance } from '@/lib/types';

interface ProfileData {
  courses: (Course & { progress: number; lessonCount: number; completedCount: number })[];
  stats: { lessonsCompleted: number; quizCount: number; classesAttended: number };
  recentAttempts: (QuizAttempt & { quiz: Quiz | null })[];
}

export default function StudentProfile() {
  const { profile, user, refreshProfile } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      loadProfileData();
    }
  }, [profile]);

  async function loadProfileData() {
    if (!profile) return;

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', profile.id);

    if (!enrollments || enrollments.length === 0) {
      setData({ courses: [], stats: { lessonsCompleted: 0, quizCount: 0, classesAttended: 0 }, recentAttempts: [] });
      setLoading(false);
      return;
    }

    const courseIds = enrollments.map((e) => e.course_id);
    const { data: courses } = await supabase.from('courses').select('*').in('id', courseIds);
    const { data: modules } = await supabase.from('modules').select('*').in('course_id', courseIds);
    const moduleIds = (modules || []).map((m) => m.id);
    const { data: lessons } = await supabase.from('lessons').select('*').in('module_id', moduleIds).eq('published', true);
    const { data: progress } = await supabase.from('lesson_progress').select('*').eq('student_id', profile.id).eq('completed', true);
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
      .eq('student_id', profile.id)
      .order('completed_at', { ascending: false })
      .limit(5);

    const { data: attendance } = await supabase
      .from('class_attendance')
      .select('id')
      .eq('student_id', profile.id)
      .eq('attended', true);

    setData({
      courses: coursesWithProgress,
      stats: {
        lessonsCompleted: completedIds.size,
        quizCount: (attempts || []).length,
        classesAttended: attendance?.length || 0,
      },
      recentAttempts: (attempts || []) as (QuizAttempt & { quiz: Quiz | null })[],
    });
    setLoading(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
    if (error) {
      toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: 'Profile updated successfully.' });
      setEditing(false);
    }
    setSaving(false);
  }

  if (loading || !profile) return <StudentLayout><LoadingState /></StudentLayout>;

  return (
    <StudentLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and view your learning stats.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <Card className="border-border/60 lg:col-span-1">
          <CardHeader className="items-center text-center">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-navy font-display text-2xl font-bold text-cream">
              {profile.full_name?.charAt(0).toUpperCase()}
            </div>
            <CardTitle className="font-display text-xl">{profile.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground">Student</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!editing ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{profile.full_name}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{user?.email || profile.id}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving} className="flex-1 bg-navy text-cream hover:bg-navy-light">
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats + Courses */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-navy/5 text-navy">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <p className="font-display text-2xl font-bold text-foreground">{data?.stats.lessonsCompleted ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Lessons Done</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-navy/5 text-navy">
                    <Award className="h-5 w-5" />
                  </div>
                  <p className="font-display text-2xl font-bold text-foreground">{data?.stats.quizCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Quizzes Done</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-navy/5 text-navy">
                    <Video className="h-5 w-5" />
                  </div>
                  <p className="font-display text-2xl font-bold text-foreground">{data?.stats.classesAttended ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrolled Courses */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="font-display text-lg">Enrolled Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No enrolled courses.</p>
              ) : (
                <div className="space-y-4">
                  {data?.courses.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border/40 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{c.title}</span>
                        <span className="text-sm font-semibold text-navy">{c.progress}%</span>
                      </div>
                      <Progress value={c.progress} className="h-1.5" />
                      <p className="mt-2 text-xs text-muted-foreground">{c.completedCount} of {c.lessonCount} lessons</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
