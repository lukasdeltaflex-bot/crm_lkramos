"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

const THEMES = ["zinc", "blue", "green", "violet", "orange", "red", "rose", "gray"];

type CustomThemeProviderProps = ThemeProviderProps & {
  children: React.ReactNode;
};

export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  return <NextThemesProvider {...props} themes={THEMES}>{children}</NextThemesProvider>
}


export function useTheme() {
    const { theme, setTheme, ...rest } = useNextTheme();

    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
        setMounted(true);
        // Add theme class to body on mount
        const currentTheme = localStorage.getItem('theme-color') || 'zinc';
        document.body.classList.remove(...THEMES.map(t => `theme-${t}`));
        document.body.classList.add(`theme-${currentTheme}`);
    }, []);

    const customSetTheme = (newTheme: string) => {
        if (mounted) {
            localStorage.setItem('theme-color', newTheme);
            document.body.classList.remove(...THEMES.map(t => `theme-${t}`));
            document.body.classList.add(`theme-${newTheme}`);
            // This is a bit of a hack to force re-render on components that use useTheme
            setTheme(theme === 'light' ? 'dark' : 'light');
            setTheme(theme!);
        }
    };
    
    return { ...rest, theme, setTheme: customSetTheme, currentTheme: mounted ? localStorage.getItem('theme-color') || 'zinc' : 'zinc' };
}
