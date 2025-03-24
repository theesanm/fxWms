'use client';

import { useState } from 'react';
import SideMenu from '@/components/side-menu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuthStore();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <SideMenu isCollapsed={isCollapsed} onCollapse={setIsCollapsed} />
      <main className={cn(
        "flex-1 overflow-auto bg-gray-50 transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}



