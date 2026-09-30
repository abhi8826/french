import { LayoutDashboard, BookOpen, Users, Video } from 'lucide-react';
import { ReactNode } from 'react';
import { AppLayout } from '@/components/shared/AppLayout';

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Courses', icon: BookOpen, path: '/admin/courses' },
  { label: 'Students', icon: Users, path: '/admin/students' },
  { label: 'Classes', icon: Video, path: '/admin/classes' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppLayout navItems={adminNav} brandLabel="Teacher Portal" brandAccent="text-cream/50">
      {children}
    </AppLayout>
  );
}
