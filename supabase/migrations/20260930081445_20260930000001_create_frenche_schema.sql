/*
# Create Complete Frenché Learning Platform Schema

## Overview
This migration creates the entire database schema for Frenché, a French language learning platform
with two user roles: **students** and **teachers**.

## New Tables (14 total)
1. profiles, 2. courses, 3. modules, 4. lessons, 5. resources, 6. vocab,
7. enrollments, 8. lesson_progress, 9. quizzes, 10. quiz_questions,
11. quiz_attempts, 12. quiz_answers, 13. classes, 14. class_attendance

## Helper Function
- is_teacher() — SECURITY DEFINER, checks if current user has 'teacher' role.

## Trigger
- handle_new_user() — Auto-creates profile row on auth user signup.

## Security (RLS)
- Content tables: all authenticated users SELECT, only teachers INSERT/UPDATE/DELETE.
- profiles: own read/update, teacher read all/update any, own insert.
- enrollments: own select, teacher full.
- lesson_progress: own select/insert/update, teacher select.
- quiz_attempts: own select/insert, teacher select.
- quiz_answers: own select/insert (via parent attempt), teacher select.
- class_attendance: own select, teacher full.
*/

-- ============================================================
-- 1. profiles table (no policies yet — is_teacher must exist first)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  avatar_url text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
  last_active timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: is_teacher() (after profiles table exists)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$;

-- Now add profiles policies
DROP POLICY IF EXISTS "profiles_select_own_or_teacher" ON public.profiles;
CREATE POLICY "profiles_select_own_or_teacher" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_teacher());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own_or_teacher" ON public.profiles;
CREATE POLICY "profiles_update_own_or_teacher" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_teacher())
  WITH CHECK (auth.uid() = id OR public.is_teacher());

-- ============================================================
-- 2. courses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  level text NOT NULL DEFAULT 'A1' CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  thumbnail_url text,
  estimated_duration text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select_all" ON public.courses;
CREATE POLICY "courses_select_all" ON public.courses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "courses_insert_teacher" ON public.courses;
CREATE POLICY "courses_insert_teacher" ON public.courses FOR INSERT TO authenticated WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "courses_update_teacher" ON public.courses;
CREATE POLICY "courses_update_teacher" ON public.courses FOR UPDATE TO authenticated USING (public.is_teacher()) WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "courses_delete_teacher" ON public.courses;
CREATE POLICY "courses_delete_teacher" ON public.courses FOR DELETE TO authenticated USING (public.is_teacher());

-- ============================================================
-- 3. modules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  "order" integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules_select_all" ON public.modules;
CREATE POLICY "modules_select_all" ON public.modules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "modules_insert_teacher" ON public.modules;
CREATE POLICY "modules_insert_teacher" ON public.modules FOR INSERT TO authenticated WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "modules_update_teacher" ON public.modules;
CREATE POLICY "modules_update_teacher" ON public.modules FOR UPDATE TO authenticated USING (public.is_teacher()) WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "modules_delete_teacher" ON public.modules;
CREATE POLICY "modules_delete_teacher" ON public.modules FOR DELETE TO authenticated USING (public.is_teacher());

-- ============================================================
-- 4. lessons
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text,
  notes text,
  duration_minutes integer NOT NULL DEFAULT 10,
  "order" integer NOT NULL DEFAULT 1,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_select_all" ON public.lessons;
CREATE POLICY "lessons_select_all" ON public.lessons FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "lessons_insert_teacher" ON public.lessons;
CREATE POLICY "lessons_insert_teacher" ON public.lessons FOR INSERT TO authenticated WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "lessons_update_teacher" ON public.lessons;
CREATE POLICY "lessons_update_teacher" ON public.lessons FOR UPDATE TO authenticated USING (public.is_teacher()) WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "lessons_delete_teacher" ON public.lessons;
CREATE POLICY "lessons_delete_teacher" ON public.lessons FOR DELETE TO authenticated USING (public.is_teacher());

-- ============================================================
-- 5. resources
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT 'PDF',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resources_select_all" ON public.resources;
CREATE POLICY "resources_select_all" ON public.resources FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "resources_insert_teacher" ON public.resources;
CREATE POLICY "resources_insert_teacher" ON public.resources FOR INSERT TO authenticated WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "resources_update_teacher" ON public.resources;
CREATE POLICY "resources_update_teacher" ON public.resources FOR UPDATE TO authenticated USING (public.is_teacher()) WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "resources_delete_teacher" ON public.resources;
CREATE POLICY "resources_delete_teacher" ON public.resources FOR DELETE TO authenticated USING (public.is_teacher());

-- ============================================================
-- 6. vocab
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vocab (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  french text NOT NULL DEFAULT '',
  english text NOT NULL DEFAULT '',
  gender text,
  audio_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vocab ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vocab_select_all" ON public.vocab;
CREATE POLICY "vocab_select_all" ON public.vocab FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "vocab_insert_teacher" ON public.vocab;
CREATE POLICY "vocab_insert_teacher" ON public.vocab FOR INSERT TO authenticated WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "vocab_update_teacher" ON public.vocab;
CREATE POLICY "vocab_update_teacher" ON public.vocab FOR UPDATE TO authenticated USING (public.is_teacher()) WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "vocab_delete_teacher" ON public.vocab;
CREATE POLICY "vocab_delete_teacher" ON public.vocab FOR DELETE TO authenticated USING (public.is_teacher());

-- ============================================================
-- 7. enrollments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollments_select_own_or_teacher" ON public.enrollments;
CREATE POLICY "enrollments_select_own_or_teacher" ON public.enrollments FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR public.is_teacher());
DROP POLICY IF EXISTS "enrollments_insert_teacher" ON public.enrollments;
CREATE POLICY "enrollments_insert_teacher" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "enrollments_delete_teacher" ON public.enrollments;
CREATE POLICY "enrollments_delete_teacher" ON public.enrollments FOR DELETE TO authenticated USING (public.is_teacher());

-- ============================================================
-- 8. lesson_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE (student_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progress_select_own_or_teacher" ON public.lesson_progress;
CREATE POLICY "progress_select_own_or_teacher" ON public.lesson_progress FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR public.is_teacher());
DROP POLICY IF EXISTS "progress_insert_own" ON public.lesson_progress;
CREATE POLICY "progress_insert_own" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "progress_update_own" ON public.lesson_progress;
CREATE POLICY "progress_update_own" ON public.lesson_progress FOR UPDATE TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- ============================================================
-- 9. quizzes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_select_all" ON public.quizzes;
CREATE POLICY "quizzes_select_all" ON public.quizzes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "quizzes_insert_teacher" ON public.quizzes;
CREATE POLICY "quizzes_insert_teacher" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "quizzes_update_teacher" ON public.quizzes;
CREATE POLICY "quizzes_update_teacher" ON public.quizzes FOR UPDATE TO authenticated USING (public.is_teacher()) WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "quizzes_delete_teacher" ON public.quizzes;
CREATE POLICY "quizzes_delete_teacher" ON public.quizzes FOR DELETE TO authenticated USING (public.is_teacher());

-- ============================================================
-- 10. quiz_questions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL DEFAULT '',
  question_type text NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false')),
  options text[] NOT NULL DEFAULT '{}',
  correct_index integer NOT NULL DEFAULT 0,
  explanation text,
  "order" integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_questions_select_all" ON public.quiz_questions;
CREATE POLICY "quiz_questions_select_all" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "quiz_questions_insert_teacher" ON public.quiz_questions;
CREATE POLICY "quiz_questions_insert_teacher" ON public.quiz_questions FOR INSERT TO authenticated WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "quiz_questions_update_teacher" ON public.quiz_questions;
CREATE POLICY "quiz_questions_update_teacher" ON public.quiz_questions FOR UPDATE TO authenticated USING (public.is_teacher()) WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "quiz_questions_delete_teacher" ON public.quiz_questions;
CREATE POLICY "quiz_questions_delete_teacher" ON public.quiz_questions FOR DELETE TO authenticated USING (public.is_teacher());

-- ============================================================
-- 11. quiz_attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attempts_select_own_or_teacher" ON public.quiz_attempts;
CREATE POLICY "attempts_select_own_or_teacher" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR public.is_teacher());
DROP POLICY IF EXISTS "attempts_insert_own" ON public.quiz_attempts;
CREATE POLICY "attempts_insert_own" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- ============================================================
-- 12. quiz_answers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_index integer NOT NULL DEFAULT 0,
  is_correct boolean NOT NULL DEFAULT false
);
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "answers_select_own_or_teacher" ON public.quiz_answers;
CREATE POLICY "answers_select_own_or_teacher" ON public.quiz_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = quiz_answers.attempt_id AND (qa.student_id = auth.uid() OR public.is_teacher())));
DROP POLICY IF EXISTS "answers_insert_own" ON public.quiz_answers;
CREATE POLICY "answers_insert_own" ON public.quiz_answers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.quiz_attempts qa WHERE qa.id = quiz_answers.attempt_id AND qa.student_id = auth.uid()));

-- ============================================================
-- 13. classes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text,
  class_date date NOT NULL DEFAULT CURRENT_DATE,
  start_time time NOT NULL DEFAULT '19:00',
  end_time time,
  meeting_url text,
  recording_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classes_select_all" ON public.classes;
CREATE POLICY "classes_select_all" ON public.classes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "classes_insert_teacher" ON public.classes;
CREATE POLICY "classes_insert_teacher" ON public.classes FOR INSERT TO authenticated WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "classes_update_teacher" ON public.classes;
CREATE POLICY "classes_update_teacher" ON public.classes FOR UPDATE TO authenticated USING (public.is_teacher()) WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "classes_delete_teacher" ON public.classes;
CREATE POLICY "classes_delete_teacher" ON public.classes FOR DELETE TO authenticated USING (public.is_teacher());

-- ============================================================
-- 14. class_attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS public.class_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attended boolean NOT NULL DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);
ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select_own_or_teacher" ON public.class_attendance;
CREATE POLICY "attendance_select_own_or_teacher" ON public.class_attendance FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR public.is_teacher());
DROP POLICY IF EXISTS "attendance_insert_teacher" ON public.class_attendance;
CREATE POLICY "attendance_insert_teacher" ON public.class_attendance FOR INSERT TO authenticated WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "attendance_update_teacher" ON public.class_attendance;
CREATE POLICY "attendance_update_teacher" ON public.class_attendance FOR UPDATE TO authenticated USING (public.is_teacher()) WITH CHECK (public.is_teacher());
DROP POLICY IF EXISTS "attendance_delete_teacher" ON public.class_attendance;
CREATE POLICY "attendance_delete_teacher" ON public.class_attendance FOR DELETE TO authenticated USING (public.is_teacher());

-- ============================================================
-- Trigger: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_resources_lesson_id ON public.resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocab_lesson_id ON public.vocab(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_id ON public.lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON public.quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_classes_course_id ON public.classes(course_id);
CREATE INDEX IF NOT EXISTS idx_classes_class_date ON public.classes(class_date);
CREATE INDEX IF NOT EXISTS idx_class_attendance_student_id ON public.class_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_class_id ON public.class_attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);