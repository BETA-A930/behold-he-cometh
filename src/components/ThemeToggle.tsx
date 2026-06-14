import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = (theme ?? "dark") === "dark";

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-14 h-7 rounded-full border border-border/60 bg-secondary/60 backdrop-blur-md transition-colors hover:border-border"
    >
      <span
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-transform duration-300"
        style={{ transform: mounted && !isDark ? "translateX(28px)" : "translateX(0)" }}
      >
        {mounted && !isDark ? <Sun size={12} /> : <Moon size={12} />}
      </span>
    </button>
  );
};

export default ThemeToggle;
