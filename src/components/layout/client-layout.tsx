'use client';

import { useState } from 'react';
import SideMenu from '@/components/side-menu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { ThemeToggle } from '@/components/theme-toggle';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuthStore();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <div className="fixed z-[100]"> {/* Add a wrapper with high z-index */}
        <SideMenu isCollapsed={isCollapsed} onCollapse={setIsCollapsed} />
      </div>
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        "bg-secondary-light dark:bg-gray-900",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="p-4 flex justify-end bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <ThemeToggle />
        </div>
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
}









