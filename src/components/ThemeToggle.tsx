"use client";

import * as React from "react";
import { Moon, Sun, Flame } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("red");
    else setTheme("light");
  };

  if (!mounted) {
    return <div className="w-9 h-9" />; // placeholder
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {theme === "red" ? (
        <Flame className="h-5 w-5 text-red-500" />
      ) : theme === "dark" ? (
        <Moon className="h-5 w-5 text-gray-200" />
      ) : (
        <Sun className="h-5 w-5 text-gray-800" />
      )}
    </button>
  );
}
