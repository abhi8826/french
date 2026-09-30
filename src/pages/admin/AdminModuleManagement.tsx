import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { toast } from '@/hooks/use-toast';
import type { Course, Module, Lesson } from '@/lib/types';

export default function AdminModuleManagement() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', duration_minutes: 15 });

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  async function loadData() {
    const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).maybeSingle();
    const { data: moduleData } = await supabase.from('modules').select('*').eq('course_id', courseId).order('order');
    const moduleIds = (moduleData || []).map((m) => m.id);
    const { data: lessonData } = await supabase.from('lessons').select('*').in('module_id', moduleIds).order('order');

    setCourse(courseData as Course | null);
    setModules((moduleData || []) as Module[]);
    setLessons((lessonData || []) as Lesson[]);
    if (moduleData && moduleData.length > 0) setSelectedModuleId(moduleData[0].id);
    setLoading(false);
  }

  async function createLesson() {
    if (!lessonForm.title.trim() || !selectedModuleId) return;
    const moduleLessons = lessons.filter((l) => l.module_id === selectedModuleId);
    const maxOrder = moduleLessons.length > 0 ? Math.max(...moduleLessons.map((l) => l.order)) : 0;

    const { data, error } = await supabase.from('lessons').insert({
      title: lessonForm.title,
      description: lessonForm.description,
      module_id: selectedModuleId,
      duration_minutes: lessonForm.duration_minutes,
      order: maxOrder + 1,
      published: true,
    }).select().single();

    if (error) {
      toast({ title: 'Something went wrong.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Lesson created.' });
    setShowLessonForm(false);
    setLessonForm({ title: '', description: '', duration_minutes: 15 });
    loadData();
    if (data) navigate(`/admin/lessons/${data.id}`);
  }

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (!course) return <AdminLayout><EmptyState icon={Plus} title="Course not found" /></AdminLayout>;

  return (
    <AdminLayout>
      <Link to={`/admin/courses/${courseId}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to {course.title}
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Module Management</h1>
        <p className="mt-1 text-muted-foreground">{course.title}</p>
      </div>

      {modules.length === 0 ? (
        <EmptyState icon={Plus} title="No modules yet" description="Go back and add modules to this course first." />
      ) : (
        <div className="space-y-6">
          {modules.map((mod, idx) => {
            const modLessons = lessons.filter((l) => l.module_id === mod.id);
            return (
              <Card key={mod.id} className="border-border/60">
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-cream">{idx + 1}</div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{mod.title}</h3>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        setSelectedModuleId(mod.id);
                        setLessonForm({ title: '', description: '', duration_minutes: 15 });
                        setShowLessonForm(true);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Add Lesson
                    </Button>
                  </div>
                  <div className="ml-11 space-y-2">
                    {modLessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No lessons yet.</p>
                    ) : (
                      modLessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          to={`/admin/lessons/${lesson.id}`}
                          className="flex items-center justify-between rounded-lg border border-border/40 p-3 transition-all hover:border-navy/20 hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-muted-foreground">{lesson.order}.</span>
                            <span className="text-sm font-medium text-foreground">{lesson.title}</span>
                            {!lesson.published && <span className="text-xs text-amber-600">Draft</span>}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lesson Form Dialog */}
      <Dialog open={showLessonForm} onOpenChange={setShowLessonForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Module</Label>
              <p className="text-sm text-muted-foreground">
                {modules.find((m) => m.id === selectedModuleId)?.title}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonTitle">Lesson Title</Label>
              <Input id="lessonTitle" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Definite Articles" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonDesc">Description</Label>
              <Textarea id="lessonDesc" value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input id="duration" type="number" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 10 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLessonForm(false)}>Cancel</Button>
            <Button onClick={createLesson} className="bg-navy text-cream hover:bg-navy-light">Create & Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
