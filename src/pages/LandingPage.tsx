import { Link } from 'react-router-dom';
import { BookOpen, Video, GraduationCap, Users, ArrowRight } from 'lucide-react';
import { PublicLayout } from '@/components/shared/AppLayout';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy pb-20 pt-32 text-cream lg:pt-40">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark via-navy to-navy" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-french-red">
              Learn French with elegance
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Master French with a structured, premium learning experience.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-cream/70">
              Structured courses, interactive lessons, live classes, and quizzes — all in one elegant
              platform designed by language experts.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link to="/signup">
                <Button size="lg" className="w-full gap-2 bg-french-red text-white hover:bg-french-red/90 sm:w-auto">
                  Start Learning Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-cream/20 bg-transparent text-cream hover:bg-cream/10 hover:text-cream sm:w-auto"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-14 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Everything you need to learn French
          </h2>
          <p className="mt-4 text-muted-foreground">
            From beginner to advanced, Frenché provides a complete learning journey.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: BookOpen, title: 'Structured Courses', desc: 'Organized by modules and lessons with clear progression from A1 to B2.' },
            { icon: Video, title: 'Video Lessons', desc: 'Watch high-quality video lessons at your own pace, anywhere, anytime.' },
            { icon: GraduationCap, title: 'Interactive Quizzes', desc: 'Test your knowledge with quizzes and track your progress over time.' },
            { icon: Users, title: 'Live Classes', desc: 'Join live classes with your teacher and practice with fellow students.' },
            { icon: BookOpen, title: 'Lesson Notes & Vocab', desc: 'Downloadable notes and vocabulary sheets for every lesson.' },
            { icon: ArrowRight, title: 'Track Progress', desc: 'See your completion rate, quiz scores, and class attendance at a glance.' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/60 bg-card p-6 transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-navy text-cream transition-colors group-hover:bg-french-red">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-medium text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Ready to begin your French journey?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join Frenché today and start learning with structured, expert-designed courses.
          </p>
          <Link to="/signup" className="mt-8 inline-block">
            <Button size="lg" className="gap-2 bg-navy text-cream hover:bg-navy-light">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-navy py-8 text-center text-cream/50">
        <p className="text-sm">Frenché — Premium French Learning Platform</p>
      </footer>
    </PublicLayout>
  );
}
