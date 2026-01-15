"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

const COLOR_THEMES = ["zinc", "blue", "green", "violet", "orange", "red", "rose", "gray"];

type CustomThemeProviderProps = ThemeProviderProps & {
  children: React.ReactNode;
};

export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  // We don't pass the custom themes to NextThemesProvider, we'll handle them ourselves.
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// Custom hook to manage both mode (light/dark) and color theme
export function useTheme() {
    const { theme: mode, setTheme: setMode } = useNextTheme();
    const [colorTheme, setColorThemeState] = React.useState('zinc');
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        // On mount, read the saved color theme from localStorage
        const savedColorTheme = localStorage.getItem('color-theme');
        if (savedColorTheme && COLOR_THEMES.includes(savedColorTheme)) {
            setColorThemeState(savedColorTheme);
            // Apply the theme class to the body
            document.body.classList.remove(...COLOR_THEMES.map(t => `theme-${t}`));
            document.body.classList.add(`theme-${savedColorTheme}`);
        } else {
            // Default to zinc if nothing is saved
            document.body.classList.add('theme-zinc');
        }
    }, []);

    const setColorTheme = (newColorTheme: string) => {
        if (mounted && COLOR_THEMES.includes(newColorTheme)) {
            // Update state
            setColorThemeState(newColorTheme);
            // Save to localStorage
            localStorage.setItem('color-theme', newColorTheme);
            // Update body class
            document.body.classList.remove(...COLOR_THEMES.map(t => `theme-${t}`));
            document.body.classList.add(`theme-${newColorTheme}`);
        }
    };
    
    // We expose the mode (light/dark) and the color theme separately
    return {
        mode,
        setMode,
        colorTheme: mounted ? colorTheme : 'zinc', // return default until mounted
        setColorTheme,
    };
}
