import { LayoutDashboard, BookOpen, Video, User } from 'lucide-react';
import { ReactNode } from 'react';
import { AppLayout } from '@/components/shared/AppLayout';

const studentNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
  { label: 'My Courses', icon: BookOpen, path: '/student/courses' },
  { label: 'Classes', icon: Video, path: '/student/classes' },
  { label: 'Profile', icon: User, path: '/student/profile' },
];

export function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout navItems={studentNav} brandLabel="Student Portal" brandAccent="text-cream/50">
      {children}
    </AppLayout>
  );
}
