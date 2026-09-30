export type UserRole = 'student' | 'teacher';

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  last_active: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  status: 'draft' | 'published';
  thumbnail_url: string | null;
  estimated_duration: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  notes: string | null;
  duration_minutes: number;
  order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  lesson_id: string;
  title: string;
  file_url: string;
  file_type: string;
  created_at: string;
}

export interface VocabItem {
  id: string;
  lesson_id: string;
  french: string;
  english: string;
  gender: string | null;
  audio_url: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
}

export interface LessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_index: number;
  explanation: string | null;
  order: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total: number;
  started_at: string;
  completed_at: string;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_index: number;
  is_correct: boolean;
}

export interface ClassSession {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  class_date: string;
  start_time: string;
  end_time: string | null;
  meeting_url: string | null;
  recording_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassAttendance {
  id: string;
  class_id: string;
  student_id: string;
  attended: boolean;
  recorded_at: string;
}

// Joined types for convenience
export interface CourseWithCounts extends Course {
  modules?: Module[];
  module_count?: number;
  lesson_count?: number;
  student_count?: number;
  avg_progress?: number;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export interface LessonWithDetails extends Lesson {
  module?: Module;
  resources: Resource[];
  vocab: VocabItem[];
  quizzes: QuizWithQuestions[];
}

export interface QuizWithQuestions extends Quiz {
  questions: QuizQuestion[];
}

export interface QuizAttemptWithDetails extends QuizAttempt {
  answers: QuizAnswer[];
  quiz?: Quiz;
}
