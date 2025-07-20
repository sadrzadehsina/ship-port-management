import { MdLightMode, MdDarkMode } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <MdDarkMode className="h-4 w-4" />
      ) : (
        <MdLightMode className="h-4 w-4" />
      )}
    </Button>
  );
}
