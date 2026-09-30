import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, BookOpen, ChevronRight } from 'lucide-react';
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

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export default function AdminCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId]);

  async function loadData() {
    const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).maybeSingle();
    const { data: moduleData } = await supabase.from('modules').select('*').eq('course_id', courseId).order('order');
    const moduleIds = (moduleData || []).map((m) => m.id);
    const { data: lessonData } = await supabase.from('lessons').select('*').in('module_id', moduleIds).order('order');

    const modulesWithLessons: ModuleWithLessons[] = (moduleData || []).map((m: Module) => ({
      ...m,
      lessons: (lessonData || []).filter((l: Lesson) => l.module_id === m.id),
    }));

    setCourse(courseData as Course | null);
    setModules(modulesWithLessons);
    setLoading(false);
  }

  function openNewModule() {
    setEditingModule(null);
    setModuleForm({ title: '', description: '' });
    setShowModuleForm(true);
  }

  function openEditModule(mod: Module) {
    setEditingModule(mod);
    setModuleForm({ title: mod.title, description: mod.description || '' });
    setShowModuleForm(true);
  }

  async function saveModule() {
    if (!moduleForm.title.trim() || !courseId) return;
    const maxOrder = modules.length > 0 ? Math.max(...modules.map((m) => m.order)) : 0;

    if (editingModule) {
      const { error } = await supabase.from('modules').update(moduleForm).eq('id', editingModule.id);
      if (error) {
        toast({ title: 'Something went wrong.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Module updated.' });
    } else {
      const { error } = await supabase.from('modules').insert({
        ...moduleForm,
        course_id: courseId,
        order: maxOrder + 1,
      });
      if (error) {
        toast({ title: 'Something went wrong.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Module created.' });
    }
    setShowModuleForm(false);
    loadData();
  }

  async function deleteModule(mod: Module) {
    if (!confirm(`Delete "${mod.title}" and all its lessons?`)) return;
    const { error } = await supabase.from('modules').delete().eq('id', mod.id);
    if (error) {
      toast({ title: 'Something went wrong.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Module deleted.' });
    loadData();
  }

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (!course) return <AdminLayout><EmptyState icon={BookOpen} title="Course not found" /></AdminLayout>;

  return (
    <AdminLayout>
      <Link to="/admin/courses" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">{course.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{course.description}</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-foreground">Modules</h2>
        <Button onClick={openNewModule} className="gap-2 bg-navy text-cream hover:bg-navy-light">
          <Plus className="h-4 w-4" />
          Add Module
        </Button>
      </div>

      {modules.length === 0 ? (
        <EmptyState icon={BookOpen} title="No modules yet" description="Add your first module to start creating lessons." />
      ) : (
        <div className="space-y-4">
          {modules.map((mod, idx) => (
            <Card key={mod.id} className="border-border/60">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-cream">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">{mod.title}</h3>
                      {mod.description && <p className="text-sm text-muted-foreground">{mod.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModule(mod)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteModule(mod)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Lessons in module */}
                <div className="ml-11 space-y-2">
                  {mod.lessons.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No lessons yet.</p>
                  ) : (
                    mod.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        to={`/admin/lessons/${lesson.id}`}
                        className="flex items-center justify-between rounded-lg border border-border/40 p-3 transition-all hover:border-navy/20 hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {lesson.order}
                          </div>
                          <span className="text-sm font-medium text-foreground">{lesson.title}</span>
                          {!lesson.published && <span className="text-xs text-amber-600">Draft</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{lesson.duration_minutes}m</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </Link>
                    ))
                  )}
                  <Link to={`/admin/courses/${courseId}/modules`}>
                    <Button variant="ghost" size="sm" className="mt-2 gap-1 text-navy">
                      <Plus className="h-3 w-3" />
                      Add Lesson
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Module Form Dialog */}
      <Dialog open={showModuleForm} onOpenChange={setShowModuleForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingModule ? 'Edit Module' : 'Add Module'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moduleTitle">Module Title</Label>
              <Input id="moduleTitle" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Les bases du français" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moduleDesc">Description</Label>
              <Textarea id="moduleDesc" value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleForm(false)}>Cancel</Button>
            <Button onClick={saveModule} className="bg-navy text-cream hover:bg-navy-light">
              {editingModule ? 'Save' : 'Add Module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
