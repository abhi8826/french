import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { toast } from '@/hooks/use-toast';
import type { Profile, Course, Enrollment } from '@/lib/types';

interface StudentRow {
  id: string;
  full_name: string;
  email: string;
  courseCount: number;
  courseTitles: string[];
  progress: number;
  last_active: string | null;
  status: string;
}

export default function AdminStudents() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEnroll, setShowEnroll] = useState(false);
  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollCourseId, setEnrollCourseId] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    const studentIds = (profiles || []).map((p) => p.id);
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, course:courses(title)')
      .in('student_id', studentIds);

    const { data: courses } = await supabase.from('courses').select('*');
    const courseIds = (courses || []).map((c) => c.id);
    const { data: modules } = await supabase.from('modules').select('*').in('course_id', courseIds);
    const moduleIds = (modules || []).map((m) => m.id);
    const { data: lessons } = await supabase.from('lessons').select('*').in('module_id', moduleIds);
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('*')
      .in('student_id', studentIds)
      .eq('completed', true);

    const rows: StudentRow[] = (profiles || []).map((p: Profile) => {
      const studentEnrollments = (enrollments || []).filter((e) => e.student_id === p.id);
      const courseTitles = studentEnrollments.map((e: { course: { title: string } | null }) => e.course?.title).filter(Boolean) as string[];
      let prog = 0;
      if (studentEnrollments.length > 0) {
        let totalLessons = 0;
        let totalCompleted = 0;
        for (const en of studentEnrollments) {
          const cId = en.course_id;
          const cModuleIds = (modules || []).filter((m) => m.course_id === cId).map((m) => m.id);
          const cLessons = (lessons || []).filter((l) => cModuleIds.includes(l.module_id));
          const cCompleted = (progress || []).filter((pr) => cLessons.some((l) => l.id === pr.lesson_id)).length;
          totalLessons += cLessons.length;
          totalCompleted += cCompleted;
        }
        prog = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
      }
      const lastActive = p.last_active ? new Date(p.last_active).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never';
      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email || '—',
        courseCount: courseTitles.length,
        courseTitles,
        progress: prog,
        last_active: lastActive,
        status: 'Active',
      };
    });

    setStudents(rows);
    setAllStudents((profiles || []) as Profile[]);
    setAllCourses((courses || []) as Course[]);
    setLoading(false);
  }

  async function handleEnroll() {
    if (!enrollStudentId || !enrollCourseId) {
      toast({ title: 'Please select a student and course.', variant: 'destructive' });
      return;
    }
    setEnrolling(true);
    const { error } = await supabase.from('enrollments').insert({
      student_id: enrollStudentId,
      course_id: enrollCourseId,
    });
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Student is already enrolled in this course.', variant: 'destructive' });
      } else {
        toast({ title: 'Something went wrong.', variant: 'destructive' });
      }
      setEnrolling(false);
      return;
    }
    toast({ title: 'Student enrolled successfully.' });
    setShowEnroll(false);
    setEnrollStudentId('');
    setEnrollCourseId('');
    setEnrolling(false);
    loadStudents();
  }

  const filtered = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Students</h1>
          <p className="mt-1 text-muted-foreground">Manage students and enrollments.</p>
        </div>
        <Button onClick={() => setShowEnroll(true)} className="gap-2 bg-navy text-cream hover:bg-navy-light">
          <Plus className="h-4 w-4" />
          Enroll Student
        </Button>
      </div>

      <div className="mb-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description={search ? 'Try a different search.' : 'Students will appear here once they sign up.'} />
      ) : (
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Name</th>
                    <th className="pb-3 font-medium text-muted-foreground">Email</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Courses</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Progress</th>
                    <th className="pb-3 font-medium text-muted-foreground">Last Active</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-border/30 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-semibold text-cream">
                            {s.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link to={`/admin/students/${s.id}`} className="font-medium text-foreground hover:text-french-red">
                              {s.full_name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">{s.email}</td>
                      <td className="py-3 text-center text-muted-foreground">
                        {s.courseCount > 0 ? (
                          <span title={s.courseTitles.join(', ')}>
                            {s.courseCount} {s.courseCount === 1 ? 'course' : 'courses'}
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="py-3 text-center font-medium text-navy">{s.progress}%</td>
                      <td className="py-3 text-muted-foreground">{s.last_active}</td>
                      <td className="py-3 text-right">
                        <Link to={`/admin/students/${s.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Enroll Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={enrollStudentId} onValueChange={setEnrollStudentId}>
                <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                <SelectContent>
                  {allStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={enrollCourseId} onValueChange={setEnrollCourseId}>
                <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                <SelectContent>
                  {allCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnroll(false)}>Cancel</Button>
            <Button onClick={handleEnroll} disabled={enrolling} className="bg-navy text-cream hover:bg-navy-light">
              {enrolling ? 'Enrolling...' : 'Enroll'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
