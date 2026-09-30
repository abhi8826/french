import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, Volume2, PlayCircle, Award, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { StudentLayout } from '@/pages/student/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { QuizRunner } from '@/components/shared/QuizRunner';
import { toast } from '@/hooks/use-toast';
import type { Lesson, Module, Course, Resource, VocabItem, Quiz, QuizQuestion } from '@/lib/types';

interface LessonData {
  lesson: Lesson;
  module: Module;
  course: Course;
  resources: Resource[];
  vocab: VocabItem[];
  quizzes: (Quiz & { questions: QuizQuestion[] })[];
}

interface NavLesson {
  id: string;
  title: string;
  order: number;
}

export default function StudentLesson() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<LessonData | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [prevLesson, setPrevLesson] = useState<NavLesson | null>(null);
  const [nextLesson, setNextLesson] = useState<NavLesson | null>(null);

  useEffect(() => {
    if (lessonId && profile) loadLesson();
  }, [lessonId, profile]);

  async function loadLesson() {
    if (!lessonId || !profile) return;

    const { data: lesson } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .maybeSingle();

    if (!lesson) {
      setLoading(false);
      return;
    }

    const { data: module } = await supabase
      .from('modules')
      .select('*')
      .eq('id', lesson.module_id)
      .maybeSingle();

    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('id', module?.course_id)
      .maybeSingle();

    const { data: resources } = await supabase
      .from('resources')
      .select('*')
      .eq('lesson_id', lessonId);

    const { data: vocab } = await supabase
      .from('vocab')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at');

    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId);

    const quizIds = (quizzes || []).map((q) => q.id);
    let quizzesWithQuestions: (Quiz & { questions: QuizQuestion[] })[] = [];
    if (quizIds.length > 0) {
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('*')
        .in('quiz_id', quizIds)
        .order('order');
      quizzesWithQuestions = (quizzes || []).map((q: Quiz) => ({
        ...q,
        questions: (questions || []).filter((qq: QuizQuestion) => qq.quiz_id === q.id),
      }));
    }

    // Check completion
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('student_id', profile.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();
    setCompleted(progress?.completed ?? false);

    // Find prev/next lessons in the same module
    if (module) {
      const { data: moduleLessons } = await supabase
        .from('lessons')
        .select('id, title, order')
        .eq('module_id', module.id)
        .eq('published', true)
        .order('order');

      if (moduleLessons) {
        const idx = moduleLessons.findIndex((l) => l.id === lessonId);
        if (idx > 0) setPrevLesson(moduleLessons[idx - 1]);
        else setPrevLesson(null);
        if (idx < moduleLessons.length - 1) setNextLesson(moduleLessons[idx + 1]);
        else setNextLesson(null);
      }
    }

    if (module && course) {
      setData({
        lesson: lesson as Lesson,
        module: module as Module,
        course: course as Course,
        resources: (resources || []) as Resource[],
        vocab: (vocab || []) as VocabItem[],
        quizzes: quizzesWithQuestions,
      });
    }
    setLoading(false);
  }

  async function markComplete() {
    if (!profile || !lessonId) return;
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        student_id: profile.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      });

    if (error) {
      toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' });
      return;
    }
    setCompleted(true);
    toast({ title: 'Lesson marked as complete!' });
  }

  async function handleQuizComplete(answers: number[], score: number, total: number) {
    if (!profile || !data?.quizzes.length) return;
    const quiz = data.quizzes[0];

    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quiz.id,
        student_id: profile.id,
        score,
        total,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptError || !attempt) {
      toast({ title: 'Could not save quiz results.', variant: 'destructive' });
      return;
    }

    const answerRows = quiz.questions.map((q, i) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      selected_index: answers[i],
      is_correct: answers[i] === q.correct_index,
    }));

    await supabase.from('quiz_answers').insert(answerRows);
    toast({ title: 'Quiz submitted!', description: `You scored ${score}/${total}.` });
  }

  if (loading) return <StudentLayout><LoadingState /></StudentLayout>;
  if (!data) return <StudentLayout><EmptyState icon={PlayCircle} title="Lesson not found" /></StudentLayout>;

  const { lesson, module, course, resources, vocab, quizzes } = data;
  const hasVideo = lesson.video_url && lesson.video_url.trim().length > 0;
  const isYouTube = hasVideo && lesson.video_url!.includes('youtube.com/embed');
  const quiz = quizzes[0];

  return (
    <StudentLayout>
      {/* Breadcrumb */}
      <Link to={`/student/courses/${course.id}`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {course.title}
      </Link>

      {/* Lesson header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {module.title} • Lesson {lesson.order}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-foreground">{lesson.title}</h1>
        <p className="mt-2 text-muted-foreground">{lesson.description}</p>
      </div>

      {/* Video Player */}
      <Card className="mb-6 overflow-hidden border-border/60">
        <div className="relative aspect-video w-full bg-navy">
          {hasVideo ? (
            isYouTube ? (
              <iframe
                src={lesson.video_url!}
                className="h-full w-full"
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={lesson.video_url!} controls className="h-full w-full" />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-cream/60">
              <Video className="mb-3 h-12 w-12 opacity-40" />
              <p className="text-sm">Lesson video will appear here.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Lesson Notes */}
      {lesson.notes && (
        <Card className="mb-6 border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Lesson Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <LessonNotes notes={lesson.notes} />
          </CardContent>
        </Card>
      )}

      {/* Vocabulary */}
      {vocab.length > 0 && (
        <Card className="mb-6 border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Vocabulary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">French</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">English</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Gender</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Pronunciation</th>
                  </tr>
                </thead>
                <tbody>
                  {vocab.map((v) => (
                    <tr key={v.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-foreground">{v.french}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{v.english}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{v.gender || '—'}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-navy hover:text-french-red">
                          <Volume2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {resources.length > 0 && (
        <Card className="mb-6 border-border/60">
          <CardHeader>
            <CardTitle className="font-display text-lg">Lesson Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resources.map((r) => (
                <a
                  key={r.id}
                  href={r.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border/40 p-3 transition-all hover:border-navy/20 hover:bg-muted/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5 text-navy">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground uppercase">{r.file_type}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz */}
      {quiz && quiz.questions.length > 0 && (
        <div className="mb-6">
          {!showQuiz ? (
            <Card className="border-border/60">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-french-red/10 text-french-red">
                    <Award className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">{quiz.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{quiz.questions.length} questions</p>
                  </div>
                  <Button onClick={() => setShowQuiz(true)} className="gap-2 bg-french-red text-white hover:bg-french-red/90">
                    Start Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <QuizRunner
              quizTitle={quiz.title}
              questions={quiz.questions}
              onComplete={handleQuizComplete}
            />
          )}
        </div>
      )}

      {/* Navigation + Mark Complete */}
      <div className="flex flex-col gap-4 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={!prevLesson}
            onClick={() => prevLesson && navigate(`/student/lesson/${prevLesson.id}`)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={!nextLesson}
            onClick={() => nextLesson && navigate(`/student/lesson/${nextLesson.id}`)}
            className="gap-1"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={markComplete}
          disabled={completed}
          className={completed ? 'gap-2 bg-green-600 text-white' : 'gap-2 bg-navy text-cream hover:bg-navy-light'}
        >
          <CheckCircle className="h-4 w-4" />
          {completed ? 'Completed' : 'Mark as Complete'}
        </Button>
      </div>
    </StudentLayout>
  );
}

// Simple markdown-ish renderer for lesson notes
function LessonNotes({ notes }: { notes: string }) {
  const lines = notes.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  function flushTable() {
    if (tableRows.length === 0) return;
    elements.push(
      <div key={`table-${elements.length}`} className="my-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              {tableRows[0].map((cell, i) => (
                <th key={i} className="px-3 py-2 text-left font-medium text-foreground">{cell.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(2).map((row, ri) => (
              <tr key={ri} className="border-b border-border/40">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-muted-foreground">{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableRows.push(trimmed.slice(1, -1).split('|'));
      return;
    }

    if (inTable) {
      flushTable();
      inTable = false;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(<h4 key={idx} className="mt-4 mb-2 font-display text-base font-semibold text-foreground">{trimmed.slice(4)}</h4>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={idx} className="mt-5 mb-2 font-display text-lg font-semibold text-foreground">{trimmed.slice(3)}</h3>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h2 key={idx} className="mt-2 mb-3 font-display text-xl font-bold text-foreground">{trimmed.slice(2)}</h2>);
    } else if (trimmed.startsWith('> ')) {
      elements.push(<blockquote key={idx} className="my-3 border-l-4 border-french-red/40 bg-muted/20 px-4 py-2 text-sm italic text-muted-foreground">{trimmed.slice(2)}</blockquote>);
    } else if (trimmed.startsWith('- ')) {
      elements.push(<div key={idx} className="ml-4 my-1 flex gap-2 text-sm text-foreground"><span className="text-french-red">•</span><span>{renderBold(trimmed.slice(2))}</span></div>);
    } else if (trimmed === '') {
      elements.push(<div key={idx} className="h-3" />);
    } else {
      elements.push(<p key={idx} className="my-1.5 text-sm leading-relaxed text-foreground">{renderBold(trimmed)}</p>);
    }
  });

  if (inTable) flushTable();

  return <div>{elements}</div>;
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
