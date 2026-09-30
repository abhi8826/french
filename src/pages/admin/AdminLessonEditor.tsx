import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, FileText, Award, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { toast } from '@/hooks/use-toast';
import type { Lesson, Module, Course, Resource, VocabItem, Quiz, QuizQuestion } from '@/lib/types';

export default function AdminLessonEditor() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [quizzes, setQuizzes] = useState<(Quiz & { questions: QuizQuestion[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizForm, setQuizForm] = useState<{ title: string; questions: { question_text: string; question_type: 'multiple_choice' | 'true_false'; options: string[]; correct_index: number; explanation: string }[] }>({
    title: '',
    questions: [{ question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_index: 0, explanation: '' }],
  });

  useEffect(() => {
    if (lessonId) loadData();
  }, [lessonId]);

  async function loadData() {
    const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', lessonId).maybeSingle();
    if (!lessonData) { setLoading(false); return; }

    const { data: moduleData } = await supabase.from('modules').select('*').eq('id', lessonData.module_id).maybeSingle();
    const { data: courseData } = await supabase.from('courses').select('*').eq('id', moduleData?.course_id).maybeSingle();
    const { data: resData } = await supabase.from('resources').select('*').eq('lesson_id', lessonId);
    const { data: vocabData } = await supabase.from('vocab').select('*').eq('lesson_id', lessonId).order('created_at');
    const { data: quizData } = await supabase.from('quizzes').select('*').eq('lesson_id', lessonId);
    const quizIds = (quizData || []).map((q) => q.id);
    let quizzesWithQs: (Quiz & { questions: QuizQuestion[] })[] = [];
    if (quizIds.length > 0) {
      const { data: qData } = await supabase.from('quiz_questions').select('*').in('quiz_id', quizIds).order('order');
      quizzesWithQs = (quizData || []).map((q: Quiz) => ({
        ...q,
        questions: (qData || []).filter((qq: QuizQuestion) => qq.quiz_id === q.id),
      }));
    }

    setLesson(lessonData as Lesson);
    setModule(moduleData as Module);
    setCourse(courseData as Course);
    setResources((resData || []) as Resource[]);
    setVocab((vocabData || []) as VocabItem[]);
    setQuizzes(quizzesWithQs);
    setLoading(false);
  }

  async function saveLesson() {
    if (!lesson || !lessonId) return;
    setSaving(true);
    const { error } = await supabase.from('lessons').update({
      title: lesson.title,
      description: lesson.description,
      video_url: lesson.video_url,
      notes: lesson.notes,
      duration_minutes: lesson.duration_minutes,
      published: lesson.published,
    }).eq('id', lessonId);

    if (error) {
      toast({ title: 'Something went wrong.', variant: 'destructive' });
    } else {
      toast({ title: 'Lesson updated successfully.' });
    }
    setSaving(false);
  }

  async function addResource() {
    if (!lessonId) return;
    const { data, error } = await supabase.from('resources').insert({
      lesson_id: lessonId,
      title: 'New Resource',
      file_url: '',
    }).select().single();
    if (error) {
      toast({ title: 'Something went wrong.', variant: 'destructive' });
      return;
    }
    setResources([...resources, data as Resource]);
  }

  async function updateResource(id: string, field: keyof Resource, value: string) {
    const { error } = await supabase.from('resources').update({ [field]: value }).eq('id', id);
    if (error) return;
    setResources(resources.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }

  async function deleteResource(id: string) {
    await supabase.from('resources').delete().eq('id', id);
    setResources(resources.filter((r) => r.id !== id));
  }

  async function addVocab() {
    if (!lessonId) return;
    const { data, error } = await supabase.from('vocab').insert({
      lesson_id: lessonId,
      french: '',
      english: '',
      gender: '',
    }).select().single();
    if (error) return;
    setVocab([...vocab, data as VocabItem]);
  }

  async function updateVocab(id: string, field: keyof VocabItem, value: string) {
    await supabase.from('vocab').update({ [field]: value }).eq('id', id);
    setVocab(vocab.map((v) => v.id === id ? { ...v, [field]: value } : v));
  }

  async function deleteVocab(id: string) {
    await supabase.from('vocab').delete().eq('id', id);
    setVocab(vocab.filter((v) => v.id !== id));
  }

  async function saveQuiz() {
    if (!lessonId || !quizForm.title.trim()) return;
    const { data: quiz, error: quizErr } = await supabase.from('quizzes').insert({
      lesson_id: lessonId,
      title: quizForm.title,
    }).select().single();
    if (quizErr || !quiz) {
      toast({ title: 'Something went wrong.', variant: 'destructive' });
      return;
    }

    const questions = quizForm.questions.filter((q) => q.question_text.trim());
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await supabase.from('quiz_questions').insert({
        quiz_id: quiz.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.question_type === 'true_false' ? ['True', 'False'] : q.options.filter((o) => o.trim()),
        correct_index: q.correct_index,
        explanation: q.explanation,
        order: i + 1,
      });
    }
    toast({ title: 'Quiz created successfully.' });
    setShowQuizForm(false);
    setQuizForm({ title: '', questions: [{ question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_index: 0, explanation: '' }] });
    loadData();
  }

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (!lesson) return <AdminLayout><EmptyState icon={FileText} title="Lesson not found" /></AdminLayout>;

  return (
    <AdminLayout>
      <Link to={course ? `/admin/courses/${course.id}` : '/admin/courses'} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Course
      </Link>

      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{module?.title}</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-foreground">Edit Lesson</h1>
      </div>

      <Tabs defaultValue="content">
        <TabsList className="mb-6">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="vocab">Vocabulary</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card className="border-border/60">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Input id="title" value={lesson.title} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" value={lesson.description || ''} onChange={(e) => setLesson({ ...lesson, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video">Video URL (YouTube embed or direct URL)</Label>
                <Input id="video" value={lesson.video_url || ''} onChange={(e) => setLesson({ ...lesson, video_url: e.target.value })} placeholder="https://www.youtube.com/embed/..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input id="duration" type="number" value={lesson.duration_minutes} onChange={(e) => setLesson({ ...lesson, duration_minutes: parseInt(e.target.value) || 10 })} />
                </div>
                <div className="flex items-end gap-3 pb-1">
                  <Switch checked={lesson.published} onCheckedChange={(v) => setLesson({ ...lesson, published: v })} id="published" />
                  <Label htmlFor="published">Published</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Lesson Notes (Markdown-style)</Label>
                <Textarea
                  id="notes"
                  value={lesson.notes || ''}
                  onChange={(e) => setLesson({ ...lesson, notes: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="# Heading&#10;&#10;**Bold text**&#10;&#10;- List item&#10;&#10;> Example"
                />
              </div>
              <Button onClick={saveLesson} disabled={saving} className="gap-2 bg-navy text-cream hover:bg-navy-light">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Lesson'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg">Resources</CardTitle>
                <Button size="sm" variant="outline" className="gap-1" onClick={addResource}>
                  <Plus className="h-3 w-3" /> Add Resource
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {resources.length === 0 ? (
                <EmptyState icon={FileText} title="No resources" description="Add downloadable PDFs or links for this lesson." className="py-8" />
              ) : (
                <div className="space-y-3">
                  {resources.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input value={r.title} onChange={(e) => updateResource(r.id, 'title', e.target.value)} placeholder="Resource title" />
                        <Input value={r.file_url} onChange={(e) => updateResource(r.id, 'file_url', e.target.value)} placeholder="File URL" />
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteResource(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vocab Tab */}
        <TabsContent value="vocab">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg">Vocabulary</CardTitle>
                <Button size="sm" variant="outline" className="gap-1" onClick={addVocab}>
                  <Plus className="h-3 w-3" /> Add Word
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {vocab.length === 0 ? (
                <EmptyState icon={Plus} title="No vocabulary" description="Add vocabulary cards for this lesson." className="py-8" />
              ) : (
                <div className="space-y-3">
                  {vocab.map((v) => (
                    <div key={v.id} className="flex flex-col gap-2 rounded-lg border border-border/40 p-3 sm:flex-row sm:items-center">
                      <Input value={v.french} onChange={(e) => updateVocab(v.id, 'french', e.target.value)} placeholder="French" className="flex-1" />
                      <Input value={v.english} onChange={(e) => updateVocab(v.id, 'english', e.target.value)} placeholder="English" className="flex-1" />
                      <div className="flex items-center gap-2">
                        <Input value={v.gender || ''} onChange={(e) => updateVocab(v.id, 'gender', e.target.value)} placeholder="Gender" className="w-full sm:w-24" />
                        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => deleteVocab(v.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz">
          <div className="space-y-4">
            {quizzes.map((qz) => (
              <Card key={qz.id} className="border-border/60">
                <CardContent className="flex items-center justify-between pt-6">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-french-red" />
                    <div>
                      <p className="font-medium text-foreground">{qz.title}</p>
                      <p className="text-sm text-muted-foreground">{qz.questions.length} questions</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={async () => {
                      if (!confirm(`Delete quiz "${qz.title}"?`)) return;
                      await supabase.from('quizzes').delete().eq('id', qz.id);
                      toast({ title: 'Quiz deleted.' });
                      loadData();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            <Button onClick={() => setShowQuizForm(true)} className="gap-2 bg-navy text-cream hover:bg-navy-light">
              <Plus className="h-4 w-4" />
              {quizzes.length > 0 ? 'Create Another Quiz' : 'Create Quiz'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quiz Form Dialog */}
      <Dialog open={showQuizForm} onOpenChange={setShowQuizForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quiz Title</Label>
              <Input value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="Definite Articles Quiz" />
            </div>
            {quizForm.questions.map((q, qi) => (
              <div key={qi} className="space-y-3 rounded-lg border border-border/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Question {qi + 1}</span>
                  {quizForm.questions.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setQuizForm({ ...quizForm, questions: quizForm.questions.filter((_, i) => i !== qi) })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <Input value={q.question_text} onChange={(e) => {
                  const qs = [...quizForm.questions]; qs[qi] = { ...qs[qi], question_text: e.target.value }; setQuizForm({ ...quizForm, questions: qs });
                }} placeholder="Question text" />
                <div className="flex gap-2">
                  <Button size="sm" variant={q.question_type === 'multiple_choice' ? 'default' : 'outline'} onClick={() => {
                    const qs = [...quizForm.questions]; qs[qi] = { ...qs[qi], question_type: 'multiple_choice', options: ['', '', '', ''], correct_index: 0 }; setQuizForm({ ...quizForm, questions: qs });
                  }}>Multiple Choice</Button>
                  <Button size="sm" variant={q.question_type === 'true_false' ? 'default' : 'outline'} onClick={() => {
                    const qs = [...quizForm.questions]; qs[qi] = { ...qs[qi], question_type: 'true_false', options: ['True', 'False'], correct_index: 0 }; setQuizForm({ ...quizForm, questions: qs });
                  }}>True / False</Button>
                </div>
                {q.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { const qs = [...quizForm.questions]; qs[qi] = { ...qs[qi], correct_index: oi }; setQuizForm({ ...quizForm, questions: qs }); }}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${q.correct_index === oi ? 'border-green-500 bg-green-500 text-white' : 'border-border text-muted-foreground'}`}
                        >
                          {String.fromCharCode(65 + oi)}
                        </button>
                        <Input value={opt} onChange={(e) => {
                          const qs = [...quizForm.questions]; const opts = [...qs[qi].options]; opts[oi] = e.target.value; qs[qi] = { ...qs[qi], options: opts }; setQuizForm({ ...quizForm, questions: qs });
                        }} placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">Click a letter to mark the correct answer.</p>
                  </div>
                )}
                {q.question_type === 'true_false' && (
                  <div className="flex gap-2">
                    {['True', 'False'].map((opt, oi) => (
                      <Button key={oi} size="sm" variant={q.correct_index === oi ? 'default' : 'outline'} onClick={() => {
                        const qs = [...quizForm.questions]; qs[qi] = { ...qs[qi], correct_index: oi }; setQuizForm({ ...quizForm, questions: qs });
                      }}>{opt}</Button>
                    ))}
                  </div>
                )}
                <Input value={q.explanation} onChange={(e) => {
                  const qs = [...quizForm.questions]; qs[qi] = { ...qs[qi], explanation: e.target.value }; setQuizForm({ ...quizForm, questions: qs });
                }} placeholder="Explanation (optional)" />
              </div>
            ))}
            <Button variant="outline" className="w-full gap-1" onClick={() => setQuizForm({ ...quizForm, questions: [...quizForm.questions, { question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_index: 0, explanation: '' }] })}>
              <Plus className="h-3 w-3" /> Add Question
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuizForm(false)}>Cancel</Button>
            <Button onClick={saveQuiz} className="bg-navy text-cream hover:bg-navy-light">Create Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
