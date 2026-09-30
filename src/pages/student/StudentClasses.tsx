import { useEffect, useState } from 'react';
import { Video, Calendar, Clock, ExternalLink, PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { StudentLayout } from '@/pages/student/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import type { ClassSession, Course } from '@/lib/types';

export default function StudentClasses() {
  const { profile } = useAuth();
  const [upcoming, setUpcoming] = useState<(ClassSession & { course: Course })[]>([]);
  const [past, setPast] = useState<(ClassSession & { course: Course })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) loadClasses();
  }, [profile]);

  async function loadClasses() {
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
    const today = new Date().toISOString().split('T')[0];

    const { data: upcomingData } = await supabase
      .from('classes')
      .select('*, course:courses(*)')
      .in('course_id', courseIds)
      .gte('class_date', today)
      .order('class_date', { ascending: true });

    const { data: pastData } = await supabase
      .from('classes')
      .select('*, course:courses(*)')
      .in('course_id', courseIds)
      .lt('class_date', today)
      .order('class_date', { ascending: false });

    setUpcoming((upcomingData || []) as (ClassSession & { course: Course })[]);
    setPast((pastData || []) as (ClassSession & { course: Course })[]);
    setLoading(false);
  }

  if (loading) return <StudentLayout><LoadingState /></StudentLayout>;

  return (
    <StudentLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Live Classes</h1>
        <p className="mt-1 text-muted-foreground">Join upcoming classes and watch previous recordings.</p>
      </div>

      {/* Upcoming */}
      <div className="mb-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={Calendar} title="No upcoming classes" description="Check back soon for scheduled live classes." />
        ) : (
          <div className="space-y-4">
            {upcoming.map((cls) => (
              <Card key={cls.id} className="border-border/60 transition-all hover:shadow-md">
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-foreground">{cls.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{cls.course?.title}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {new Date(cls.class_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {cls.start_time.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                  {cls.meeting_url && (
                    <a href={cls.meeting_url} target="_blank" rel="noopener noreferrer">
                      <Button className="gap-2 bg-french-red text-white hover:bg-french-red/90">
                        <Video className="h-4 w-4" />
                        Join Class
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Previous */}
      <div>
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Previous Classes</h2>
        {past.length === 0 ? (
          <EmptyState icon={PlayCircle} title="No previous classes" description="Recordings of past classes will appear here." />
        ) : (
          <div className="space-y-4">
            {past.map((cls) => (
              <Card key={cls.id} className="border-border/60 transition-all hover:shadow-md">
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-foreground">{cls.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{cls.course?.title}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {new Date(cls.class_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {cls.recording_url ? (
                    <a href={cls.recording_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="gap-2 border-navy/20 hover:bg-navy hover:text-cream">
                        <PlayCircle className="h-4 w-4" />
                        Watch Recording
                      </Button>
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">No recording available</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
