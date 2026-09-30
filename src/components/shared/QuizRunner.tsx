import { useState } from 'react';
import { Check, X, ChevronLeft, ChevronRight, Award, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/lib/types';

interface QuizRunnerProps {
  quizTitle: string;
  questions: QuizQuestion[];
  onComplete: (answers: number[], score: number, total: number) => Promise<void>;
}

export function QuizRunner({ quizTitle, questions, onComplete }: QuizRunnerProps) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);

  const total = questions.length;
  const isLast = current === total - 1;
  const progressPct = ((current + 1) / total) * 100;

  const selectAnswer = (index: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[current] = index;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    const newScore = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0);
    setScore(newScore);
    setSubmitted(true);
    setSaving(true);
    await onComplete(answers, newScore, total);
    setSaving(false);
  };

  const handleRetry = () => {
    setCurrent(0);
    setAnswers(Array(total).fill(-1));
    setSubmitted(false);
    setScore(0);
  };

  if (submitted) {
    const pct = Math.round((score / total) * 100);
    return (
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <div className="mb-6 text-center">
            <div className={cn('mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full', pct >= 80 ? 'bg-green-100' : pct >= 50 ? 'bg-amber-100' : 'bg-red-100')}>
              <Award className={cn('h-8 w-8', pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600')} />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">Quiz Complete 🎉</h3>
            <p className="mt-2 text-muted-foreground">
              You scored <span className="font-display text-2xl font-bold text-navy">{score}</span> out of {total}
            </p>
            <p className="text-lg font-semibold text-french-red">{pct}%</p>
          </div>

          {/* Review answers */}
          <div className="space-y-4">
            {questions.map((q, i) => {
              const userAnswer = answers[i];
              const correct = userAnswer === q.correct_index;
              return (
                <div key={q.id} className={cn('rounded-lg border p-4', correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50')}>
                  <div className="mb-2 flex items-start gap-2">
                    {correct ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
                    <p className="text-sm font-medium text-foreground">{i + 1}. {q.question_text}</p>
                  </div>
                  <div className="ml-6 space-y-1 text-sm">
                    <p className={cn('text-foreground', correct ? '' : 'text-red-600')}>
                      Your answer: {userAnswer >= 0 ? q.options[userAnswer] : 'Not answered'}
                    </p>
                    {!correct && (
                      <p className="text-green-700">Correct answer: {q.options[q.correct_index]}</p>
                    )}
                    {q.explanation && (
                      <p className="mt-1 text-xs text-muted-foreground">💡 {q.explanation}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={handleRetry} variant="outline" className="mt-6 w-full gap-2">
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  const question = questions[current];

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-foreground">{quizTitle}</h3>
            <span className="text-sm text-muted-foreground">Question {current + 1} of {total}</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        <div className="mb-6">
          <p className="text-lg font-medium text-foreground">{question.question_text}</p>
        </div>

        <div className="space-y-3">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => selectAnswer(i)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm transition-all',
                answers[current] === i
                  ? 'border-navy bg-navy/5 text-foreground'
                  : 'border-border/50 bg-card text-foreground hover:border-navy/30 hover:bg-muted/30'
              )}
            >
              <span className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                answers[current] === i ? 'border-navy bg-navy text-cream' : 'border-border text-muted-foreground'
              )}>
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {isLast ? (
            <Button
              onClick={handleSubmit}
              disabled={answers.some((a) => a === -1) || saving}
              className="bg-french-red text-white hover:bg-french-red/90"
            >
              {saving ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
              disabled={answers[current] === -1}
              className="gap-1 bg-navy text-cream hover:bg-navy-light"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
