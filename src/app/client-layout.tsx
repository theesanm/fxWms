'use client';

import { useEffect, useRef, useState } from 'react';
import SideMenu from "@/components/side-menu";
import { useAuthStore } from "@/stores/auth.store";
import { Toaster } from 'sonner';
import { IdleTimer } from '@/utils/idle-timer';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Role } from '@/types/role';
import api from '@/lib/postgrest';

const IDLE_TIMEOUT = 30 * 60 * 1000;
const WARNING_TIME = 1 * 60 * 1000;

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const idleTimerRef = useRef<IdleTimer | null>(null);
  const warningTimerRef = useRef<IdleTimer | null>(null);
  const [userRole, setUserRole] = useState<string>('User');

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.role_id) {
        try {
          const response = await api.get(`/roles?role_id=eq.${user.role_id}`);
          if (response.data?.[0]) {
            setUserRole(response.data[0].role_name);
          }
        } catch (error) {
          console.error('Error fetching role:', error);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    if (user) {
      warningTimerRef.current = new IdleTimer({
        timeout: IDLE_TIMEOUT - WARNING_TIME,
        onIdle: () => {
          toast.warning('You will be logged out due to inactivity in 1 minute', {
            duration: WARNING_TIME,
          });
        }
      });

      idleTimerRef.current = new IdleTimer({
        timeout: IDLE_TIMEOUT,
        onIdle: () => {
          toast.error('Logged out due to inactivity');
          logout();
        }
      });

      warningTimerRef.current.start();
      idleTimerRef.current.start();

      return () => {
        warningTimerRef.current?.stop();
        idleTimerRef.current?.stop();
      };
    }
  }, [user, logout]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-secondary-light dark:bg-gray-900">
        {user && (
          <div className="fixed z-[100]">
            <SideMenu isCollapsed={isCollapsed} onCollapse={setIsCollapsed} />
          </div>
        )}
        <main className={cn(
          "flex-1 transition-all duration-300",
          user ? (isCollapsed ? "ml-16" : "ml-64") : ""
        )}>
          {user && (
            <div>
              <header className="sticky top-0 z-50 w-full border-b border-secondary-medium dark:border-gray-700">
                <div className="h-16 bg-white dark:bg-gray-800 px-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-secondary-dark dark:text-gray-200">
                          {user.username}
                        </span>
                        <span className="text-xs text-secondary dark:text-gray-400">
                          {userRole}
                        </span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-secondary-medium dark:bg-gray-700" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-secondary hover:text-secondary-dark dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              <div className="p-6">
                {children}
              </div>
            </div>
          )}
          {!user && children}
        </main>
      </div>
      <Toaster />
    </>
  );
}










