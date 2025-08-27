import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "auto";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "dark" | "light";
};

const initialState: ThemeProviderState = {
  theme: "auto",
  setTheme: () => null,
  actualTheme: "dark",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "auto",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const getTimeBasedTheme = (): "dark" | "light" => {
    const hour = new Date().getHours();
    // Day time: 6 AM to 6 PM = light mode
    // Night time: 6 PM to 6 AM = dark mode
    return hour >= 6 && hour < 18 ? "light" : "dark";
  };

  const actualTheme = theme === "auto" ? getTimeBasedTheme() : theme;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(actualTheme);
  }, [actualTheme]);

  useEffect(() => {
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  // Update theme automatically every minute when in auto mode
  useEffect(() => {
    if (theme === "auto") {
      const interval = setInterval(() => {
        const newTimeBasedTheme = getTimeBasedTheme();
        if (newTimeBasedTheme !== actualTheme) {
          const root = window.document.documentElement;
          root.classList.remove("light", "dark");
          root.classList.add(newTimeBasedTheme);
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [theme, actualTheme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
    actualTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};