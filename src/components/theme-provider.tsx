"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

const COLOR_THEMES = ["zinc", "blue", "green", "violet", "orange", "red", "rose", "gray"];

type CustomThemeProviderProps = ThemeProviderProps & {
  children: React.ReactNode;
};

// This new context will hold our color theme logic
const ColorThemeContext = React.createContext<{
  colorTheme: string;
  setColorTheme: (theme: string) => void;
} | undefined>(undefined);


function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = React.useState('zinc');
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("color-theme");
    if (savedTheme && COLOR_THEMES.includes(savedTheme)) {
        setColorThemeState(savedTheme);
    }
  }, []);

  React.useEffect(() => {
    if (isMounted) {
      document.documentElement.classList.remove(...COLOR_THEMES.map(t => `theme-${t}`));
      document.documentElement.classList.add(`theme-${colorTheme}`);
      localStorage.setItem("color-theme", colorTheme);
    }
  }, [colorTheme, isMounted]);

  const value = {
    colorTheme,
    setColorTheme: setColorThemeState,
  };

  if (!isMounted) {
    // To prevent hydration mismatch, we can return null or a loader on the server
    return null;
  }

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}


export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ColorThemeProvider>{children}</ColorThemeProvider>
    </NextThemesProvider>
  )
}

// Custom hook to manage both mode (light/dark) and color theme
export function useTheme() {
    const nextThemeContext = useNextTheme();
    const colorThemeContext = React.useContext(ColorThemeContext);

    if (nextThemeContext === undefined || colorThemeContext === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return {
        ...nextThemeContext,
        colorTheme: colorThemeContext.colorTheme,
        setColorTheme: colorThemeContext.setColorTheme,
    };
}
