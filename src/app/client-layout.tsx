'use client';

import { Auth } from "@/components/auth";
import Menu from "@/components/menu";
import { useAuthStore } from "@/stores/auth.store";
import { Toaster } from 'sonner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuthStore();

  return (
    <>
      <Auth>
        <div className="flex h-screen">
          {user && <Menu />}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </Auth>
      <Toaster />
    </>
  );
}

