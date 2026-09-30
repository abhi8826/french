import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

interface AppLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  brandLabel: string;
  brandAccent: string;
}

export function AppLayout({ children, navItems, brandLabel, brandAccent }: AppLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-navy text-cream">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-french-red font-display text-xl font-bold text-white">
          F
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold leading-none text-cream">Frenché</h1>
          <p className={cn('text-xs', brandAccent)}>{brandLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-cream/10 text-cream'
                  : 'text-cream/60 hover:bg-cream/5 hover:text-cream'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
              {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-french-red" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-cream/10 px-4 py-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 text-sm font-semibold text-cream">
            {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-cream">{profile?.full_name}</p>
            <p className="truncate text-xs text-cream/50">{profile?.role === 'teacher' ? 'Teacher' : 'Student'}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-cream/60 hover:bg-cream/5 hover:text-cream"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-navy px-4 py-3 text-cream lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-french-red font-display text-base font-bold text-white">
            F
          </div>
          <span className="font-display text-base font-semibold">Frenché</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="text-cream hover:bg-cream/10">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-2 z-10 text-cream hover:bg-cream/10"
            >
              <X className="h-5 w-5" />
            </Button>
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="fade-in mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

// Public landing layout (no sidebar)
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute left-0 right-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-french-red font-display text-xl font-bold text-white">
              F
            </div>
            <span className="font-display text-xl font-semibold text-cream">Frenché</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-cream hover:bg-cream/10 hover:text-cream">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-cream text-navy hover:bg-cream/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
