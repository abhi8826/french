import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Users, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { toast } from '@/hooks/use-toast';
import type { Course } from '@/lib/types';

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', level: 'A1', status: 'published', estimated_duration: '' });

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    setCourses((data || []) as Course[]);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setFormData({ title: '', description: '', level: 'A1', status: 'published', estimated_duration: '' });
    setShowForm(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      level: course.level,
      status: course.status,
      estimated_duration: course.estimated_duration || '',
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.title.trim()) {
      toast({ title: 'Course title is required.', variant: 'destructive' });
      return;
    }

    if (editing) {
      const { error } = await supabase.from('courses').update(formData).eq('id', editing.id);
      if (error) {
        toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Course updated successfully.' });
    } else {
      const { error } = await supabase.from('courses').insert(formData);
      if (error) {
        toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Course created successfully.' });
    }
    setShowForm(false);
    loadCourses();
  }

  async function handleDelete(course: Course) {
    if (!confirm(`Delete "${course.title}"? This will remove all modules, lessons, and content.`)) return;
    const { error } = await supabase.from('courses').delete().eq('id', course.id);
    if (error) {
      toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Course deleted.' });
    loadCourses();
  }

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Courses</h1>
          <p className="mt-1 text-muted-foreground">Create and manage your French courses.</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-navy text-cream hover:bg-navy-light">
          <Plus className="h-4 w-4" />
          New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to start adding modules and lessons."
          action={<Button onClick={openNew} className="gap-2 bg-navy text-cream hover:bg-navy-light"><Plus className="h-4 w-4" />Create Course</Button>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="group border-border/60 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex gap-2">
                    <Badge className="bg-french-red text-white">{course.level}</Badge>
                    <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                      {course.status}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(course)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(course)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link to={`/admin/courses/${course.id}`}>
                  <h3 className="font-display text-lg font-medium text-foreground hover:text-french-red">{course.title}</h3>
                </Link>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  {course.estimated_duration && <span>{course.estimated_duration}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Course Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editing ? 'Edit Course' : 'Create New Course'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="French A1 — Beginner" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Course description..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="B1">B1</SelectItem>
                    <SelectItem value="B2">B2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration</Label>
              <Input id="duration" value={formData.estimated_duration} onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })} placeholder="12 weeks" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-navy text-cream hover:bg-navy-light">
              {editing ? 'Save Changes' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
