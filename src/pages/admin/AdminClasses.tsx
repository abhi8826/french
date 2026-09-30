import { useEffect, useState } from 'react';
import { Plus, Calendar, Clock, Video, Edit, Trash2, ExternalLink, PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { toast } from '@/hooks/use-toast';
import type { Course, ClassSession } from '@/lib/types';

interface ClassWithCourse extends ClassSession {
  course: Course | null;
}

export default function AdminClasses() {
  const [classes, setClasses] = useState<ClassWithCourse[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClassSession | null>(null);
  const [form, setForm] = useState({
    title: '',
    course_id: '',
    class_date: '',
    start_time: '19:00',
    end_time: '20:00',
    meeting_url: '',
    recording_url: '',
    description: '',
  });

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    const { data: classData } = await supabase
      .from('classes')
      .select('*, course:courses(*)')
      .order('class_date', { ascending: false });
    const { data: courseData } = await supabase.from('courses').select('*').order('title');
    setClasses((classData || []) as ClassWithCourse[]);
    setCourses((courseData || []) as Course[]);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({
      title: '',
      course_id: courses[0]?.id || '',
      class_date: new Date().toISOString().split('T')[0],
      start_time: '19:00',
      end_time: '20:00',
      meeting_url: '',
      recording_url: '',
      description: '',
    });
    setShowForm(true);
  }

  function openEdit(cls: ClassSession) {
    setEditing(cls);
    setForm({
      title: cls.title,
      course_id: cls.course_id,
      class_date: cls.class_date,
      start_time: cls.start_time.slice(0, 5),
      end_time: cls.end_time?.slice(0, 5) || '',
      meeting_url: cls.meeting_url || '',
      recording_url: cls.recording_url || '',
      description: cls.description || '',
    });
    setShowForm(true);
  }

  async function saveClass() {
    if (!form.title.trim() || !form.course_id || !form.class_date) {
      toast({ title: 'Title, course, and date are required.', variant: 'destructive' });
      return;
    }

    if (editing) {
      const { error } = await supabase.from('classes').update(form).eq('id', editing.id);
      if (error) {
        toast({ title: 'Something went wrong.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Class updated successfully.' });
    } else {
      const { error } = await supabase.from('classes').insert(form);
      if (error) {
        toast({ title: 'Something went wrong.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Class scheduled successfully.' });
    }
    setShowForm(false);
    loadClasses();
  }

  async function deleteClass(cls: ClassSession) {
    if (!confirm(`Delete "${cls.title}"?`)) return;
    const { error } = await supabase.from('classes').delete().eq('id', cls.id);
    if (error) {
      toast({ title: 'Something went wrong.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Class deleted.' });
    loadClasses();
  }

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;

  const today = new Date().toISOString().split('T')[0];
  const upcoming = classes.filter((c) => c.class_date >= today);
  const past = classes.filter((c) => c.class_date < today);

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Live Classes</h1>
          <p className="mt-1 text-muted-foreground">Schedule and manage live classes.</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-navy text-cream hover:bg-navy-light">
          <Plus className="h-4 w-4" />
          Schedule Class
        </Button>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No classes scheduled"
          description="Schedule your first live class to get started."
          action={<Button onClick={openNew} className="gap-2 bg-navy text-cream hover:bg-navy-light"><Plus className="h-4 w-4" />Schedule Class</Button>}
        />
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          <div>
            <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Upcoming ({upcoming.length})</h2>
            <div className="space-y-4">
              {upcoming.map((cls) => (
                <ClassCard key={cls.id} cls={cls} onEdit={() => openEdit(cls)} onDelete={() => deleteClass(cls)} />
              ))}
            </div>
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Previous ({past.length})</h2>
              <div className="space-y-4">
                {past.map((cls) => (
                  <ClassCard key={cls.id} cls={cls} onEdit={() => openEdit(cls)} onDelete={() => deleteClass(cls)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editing ? 'Edit Class' : 'Schedule Live Class'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Class Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="French A1 — Articles" />
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.class_date} onChange={(e) => setForm({ ...form, class_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Meeting URL</Label>
              <Input value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} placeholder="https://meet.google.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Recording URL</Label>
              <Input value={form.recording_url} onChange={(e) => setForm({ ...form, recording_url: e.target.value })} placeholder="https://www.youtube.com/embed/..." />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveClass} className="bg-navy text-cream hover:bg-navy-light">
              {editing ? 'Save Changes' : 'Schedule Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function ClassCard({ cls, onEdit, onDelete }: { cls: ClassWithCourse; onEdit: () => void; onDelete: () => void }) {
  const isPast = cls.class_date < new Date().toISOString().split('T')[0];
  return (
    <Card className="border-border/60 transition-all hover:shadow-md">
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-foreground">{cls.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{cls.course?.title}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(cls.class_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {cls.start_time.slice(0, 5)}
            </span>
          </div>
          {isPast && cls.recording_url && (
            <a href={cls.recording_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-french-red hover:underline">
              <PlayCircle className="h-4 w-4" />
              Recording available
            </a>
          )}
        </div>
        <div className="flex gap-2">
          {!isPast && cls.meeting_url && (
            <a href={cls.meeting_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1">
                <ExternalLink className="h-3 w-3" />
                Join
              </Button>
            </a>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
