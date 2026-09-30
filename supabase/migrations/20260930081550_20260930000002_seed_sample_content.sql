/*
# Seed Sample Course Content

## Overview
Inserts sample French courses, modules, lessons, vocabulary, resources, quizzes, and a live class
so the app has meaningful content to display on first load.

## Data Inserted
- 2 Courses: "French A1 — Beginner" (published) and "French A2 — Elementary" (published)
- 3 Modules in A1 course: "Les bases", "Articles & Nouns", "Verbes essentiels"
- 4 Lessons across modules with notes, video URLs, vocab, resources, and a quiz
- 1 Lesson in A2 course
- 1 Upcoming live class session

## Notes
- Uses fixed UUIDs for deterministic references between parent and child rows.
- All content is in the public schema, safe to re-run (uses ON CONFLICT DO NOTHING).
*/

-- Courses
INSERT INTO public.courses (id, title, description, level, status, estimated_duration) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'French A1 — Beginner', 'Start your French journey with essential greetings, numbers, articles, and basic verb conjugation. Perfect for complete beginners.', 'A1', 'published', '12 weeks'),
  ('a2222222-2222-2222-2222-222222222222', 'French A2 — Elementary', 'Build on your A1 foundations with past tenses, everyday conversations, and practical vocabulary for travel and work.', 'A2', 'published', '14 weeks')
ON CONFLICT (id) DO NOTHING;

-- Modules for A1 course
INSERT INTO public.modules (id, course_id, title, description, "order") VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Les bases', 'Greetings, introductions, and essential phrases.', 1),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Articles & Nouns', 'Definite and indefinite articles, gender of nouns.', 2),
  ('b3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'Verbes essentiels', 'Etre, avoir, and common regular -er verbs.', 3)
ON CONFLICT (id) DO NOTHING;

-- Module for A2 course
INSERT INTO public.modules (id, course_id, title, description, "order") VALUES
  ('b4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'Le passé composé', 'Forming the passé composé with avoir and être.', 1)
ON CONFLICT (id) DO NOTHING;

-- Lessons
INSERT INTO public.lessons (id, module_id, title, description, video_url, notes, duration_minutes, "order", published) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Greetings & Introductions', 'Learn to greet people and introduce yourself in French.', 'https://www.youtube.com/embed/KM4Q7J3OT8U', '# Greetings & Introductions

## Essential Greetings

| French | English |
|--------|---------|
| Bonjour | Hello / Good morning |
| Bonsoir | Good evening |
| Salut | Hi (informal) |
| Au revoir | Goodbye |

## Introducing Yourself

- **Je m''appelle...** — My name is...
- **Je suis...** — I am...
- **Enchanté(e)** — Nice to meet you

> Practice saying your name and greeting someone each morning to build the habit!

## Formal vs Informal

- Use **vous** with strangers, elders, and in professional settings
- Use **tu** with friends, family, and peers', 20, 1, true),
  ('c2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Numbers 1-20', 'Master counting from 1 to 20 in French.', 'https://www.youtube.com/embed/lQOUyAhmVkw', '# Numbers 1-20

## Counting in French

| Number | French |
|--------|--------|
| 1 | un |
| 2 | deux |
| 3 | trois |
| 5 | cinq |
| 10 | dix |
| 20 | vingt |

> French numbers can be tricky! Pay special attention to 70 (soixante-dix) and 80 (quatre-vingts).', 15, 2, true),
  ('c3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'Definite Articles', 'Learn le, la, l'' and les — the French words for "the".', 'https://www.youtube.com/embed/x7YjSSllU8M', '# Definite Articles

## The Four Forms

| Gender | Number | Article |
|--------|--------|---------|
| Masculine | Singular | **le** |
| Feminine | Singular | **la** |
| Either (before vowel) | Singular | **l''** |
| Either | Plural | **les** |

## Examples

- **le livre** — the book
- **la table** — the table
- **l''arbre** — the tree
- **les livres** — the books

> Tip: The article must agree with the noun''s gender and number. When in doubt, look it up!', 18, 1, true),
  ('c4444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333', 'Être et Avoir', 'Master the two most important French verbs: to be and to have.', 'https://www.youtube.com/embed/_3-DZ6vTbJg', '# Être et Avoir

## Être (to be)

| Pronoun | Conjugation |
|---------|-------------|
| je | suis |
| tu | es |
| il/elle | est |
| nous | sommes |
| vous | êtes |
| ils/elles | sont |

## Avoir (to have)

| Pronoun | Conjugation |
|---------|-------------|
| je | ai |
| tu | as |
| il/elle | a |
| nous | avons |
| vous | avez |
| ils/elles | ont |

> These two verbs are the foundation of French. Memorize them completely!', 25, 1, true),
  ('c5555555-5555-5555-5555-555555555555', 'b4444444-4444-4444-4444-444444444444', 'Formation du passé composé', 'Learn how to form the passé composé with avoir and être.', NULL, '# Le passé composé

## With Avoir (most verbs)

**Subject + avoir (conjugated) + past participle**

- J''ai **parlé** — I spoke
- Tu as **mangé** — You ate
- Nous avons **fini** — We finished

## With Être (movement verbs)

**Subject + être (conjugated) + past participle**

- Je suis **allé(e)** — I went
- Elle est **partie** — She left
- Ils sont **arrivés** — They arrived

> With être, the past participle agrees with the subject in gender and number!', 30, 1, true)
ON CONFLICT (id) DO NOTHING;

-- Vocabulary for lesson 1
INSERT INTO public.vocab (lesson_id, french, english, gender) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Bonjour', 'Hello / Good morning', NULL),
  ('c1111111-1111-1111-1111-111111111111', 'Bonsoir', 'Good evening', NULL),
  ('c1111111-1111-1111-1111-111111111111', 'Salut', 'Hi (informal)', NULL),
  ('c1111111-1111-1111-1111-111111111111', 'Au revoir', 'Goodbye', NULL),
  ('c1111111-1111-1111-1111-111111111111', 'Enchanté', 'Nice to meet you', NULL),
  ('c1111111-1111-1111-1111-111111111111', 'Merci', 'Thank you', NULL),
  ('c1111111-1111-1111-1111-111111111111', 'S''il vous plaît', 'Please', NULL)
ON CONFLICT DO NOTHING;

-- Vocabulary for lesson 3 (articles lesson)
INSERT INTO public.vocab (lesson_id, french, english, gender) VALUES
  ('c3333333-3333-3333-3333-333333333333', 'le livre', 'the book', 'masculine'),
  ('c3333333-3333-3333-3333-333333333333', 'la table', 'the table', 'feminine'),
  ('c3333333-3333-3333-3333-333333333333', 'l''arbre', 'the tree', 'masculine'),
  ('c3333333-3333-3333-3333-333333333333', 'la chaise', 'the chair', 'feminine'),
  ('c3333333-3333-3333-3333-333333333333', 'le stylo', 'the pen', 'masculine')
ON CONFLICT DO NOTHING;

-- Vocabulary for lesson 4 (verbs lesson)
INSERT INTO public.vocab (lesson_id, french, english, gender) VALUES
  ('c4444444-4444-4444-4444-444444444444', 'être', 'to be', NULL),
  ('c4444444-4444-4444-4444-444444444444', 'avoir', 'to have', NULL),
  ('c4444444-4444-4444-4444-444444444444', 'je suis', 'I am', NULL),
  ('c4444444-4444-4444-4444-444444444444', 'j''ai', 'I have', NULL)
ON CONFLICT DO NOTHING;

-- Resources for lesson 1
INSERT INTO public.resources (lesson_id, title, file_url, file_type) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Greetings Cheat Sheet', 'https://example.com/greetings.pdf', 'PDF'),
  ('c1111111-1111-1111-1111-111111111111', 'Pronunciation Guide', 'https://example.com/pronunciation.mp3', 'Audio')
ON CONFLICT DO NOTHING;

-- Quiz for lesson 1
INSERT INTO public.quizzes (id, lesson_id, title) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Greetings Quiz')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (quiz_id, question_text, question_type, options, correct_index, explanation, "order") VALUES
  ('d1111111-1111-1111-1111-111111111111', 'How do you say "Hello" in French?', 'multiple_choice', ARRAY['Au revoir', 'Bonjour', 'Merci', 'Salut'], 1, 'Bonjour is the standard greeting, used from morning to evening.', 1),
  ('d1111111-1111-1111-1111-111111111111', 'What does "Enchanté" mean?', 'multiple_choice', ARRAY['Thank you', 'Goodbye', 'Nice to meet you', 'Please'], 2, 'Enchanté is used when meeting someone for the first time.', 2),
  ('d1111111-1111-1111-1111-111111111111', 'You use "tu" with strangers.', 'true_false', ARRAY['True', 'False'], 1, 'You should use "vous" with strangers. "Tu" is for friends and family.', 3)
ON CONFLICT DO NOTHING;

-- Quiz for lesson 3 (articles)
INSERT INTO public.quizzes (id, lesson_id, title) VALUES
  ('d2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 'Articles Quiz')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (quiz_id, question_text, question_type, options, correct_index, explanation, "order") VALUES
  ('d2222222-2222-2222-2222-222222222222', 'Which article do you use before a feminine singular noun?', 'multiple_choice', ARRAY['le', 'la', 'les', 'l'''], 1, 'La is used for feminine singular nouns.', 1),
  ('d2222222-2222-2222-2222-222222222222', 'What is the correct article for "arbre" (tree)?', 'multiple_choice', ARRAY['le', 'la', 'l''', 'les'], 2, 'L'' is used before a word starting with a vowel, regardless of gender.', 2),
  ('d2222222-2222-2222-2222-222222222222', 'Les is used for plural nouns.', 'true_false', ARRAY['True', 'False'], 0, 'Les is the definite article for all plural nouns.', 3)
ON CONFLICT DO NOTHING;

-- Quiz for lesson 4 (verbs)
INSERT INTO public.quizzes (id, lesson_id, title) VALUES
  ('d3333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444', 'Être et Avoir Quiz')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (quiz_id, question_text, question_type, options, correct_index, explanation, "order") VALUES
  ('d3333333-3333-3333-3333-333333333333', 'How do you conjugate "être" for "nous"?', 'multiple_choice', ARRAY['est', 'sont', 'sommes', 'êtes'], 2, 'Nous sommes — we are.', 1),
  ('d3333333-3333-3333-3333-333333333333', 'What is the correct form: "Ils ___ faim"?', 'multiple_choice', ARRAY['ai', 'as', 'a', 'ont'], 3, 'Ils ont faim — they are hungry. Use avoir with faim.', 2),
  ('d3333333-3333-3333-3333-333333333333', 'Conjugate avoir for "tu".', 'multiple_choice', ARRAY['ai', 'as', 'a', 'avons'], 1, 'Tu as — you have.', 3)
ON CONFLICT DO NOTHING;

-- Upcoming live class
INSERT INTO public.classes (course_id, title, description, class_date, start_time, end_time, meeting_url, recording_url) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'French A1 — Live Practice: Greetings', 'Practice greetings and introductions in this interactive live session.', (CURRENT_DATE + INTERVAL '7 days')::date, '19:00', '20:00', 'https://meet.google.com/abc-defg-hij', NULL),
  ('a1111111-1111-1111-1111-111111111111', 'French A1 — Articles Workshop', 'Deep dive into definite and indefinite articles with exercises.', (CURRENT_DATE + INTERVAL '14 days')::date, '18:30', '19:30', 'https://meet.google.com/xyz-abcd-efg', NULL)
ON CONFLICT DO NOTHING;