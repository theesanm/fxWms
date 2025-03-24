'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/theme.store';

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleDarkMode}
      className="w-9 px-0"
    >
      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}