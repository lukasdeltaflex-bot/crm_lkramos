"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { THEMES } from "@/lib/themes"

const RADIUS_OPTIONS = ["reto", "extra-discreto", "discreto", "suave", "moderno", "amigavel", "organico", "capsula"];
const CONTAINER_STYLES = ["moderno", "glass", "deep", "flat", "glow", "geometrico"];
const TEXTURE_OPTIONS = ["none", "dots", "grid", "lines"];
const INTENSITY_OPTIONS = ["minima", "equilibrada", "impactante", "neon"];
const FONT_OPTIONS = [
    "moderno", "classico", "mono", "arredondado", "industrial", 
    "futurista", "elegante", "real", "espacial", "minimalista",
    "editorial", "geom-vivida", "tecnica", "impacto", "clean",
    "soft", "neo-classico", "corp", "sharp", "script"
];
const ANIMATION_OPTIONS = ["instantaneo", "sutil", "atmosferico", "cinematografico"];
const SIDEBAR_OPTIONS = ["padrão", "dark", "light"];

type ColorThemeContextType = {
  colorTheme: string;
  setColorTheme: (theme: string) => void;
  radius: string;
  setRadius: (r: string) => void;
  containerStyle: string;
  setContainerStyle: (s: string) => void;
  backgroundTexture: string;
  setBackgroundTexture: (t: string) => void;
  colorIntensity: string;
  setColorIntensity: (i: string) => void;
  animationStyle: string;
  setAnimationStyle: (a: string) => void;
  fontStyle: string;
  setFontStyle: (f: string) => void;
  sidebarStyle: string;
  setSidebarStyle: (s: string) => void;
  statusColors: Record<string, string>;
  setStatusColors: (colors: Record<string, string>) => void;
};

const ColorThemeContext = React.createContext<ColorThemeContextType | undefined>(undefined);

function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorTheme] = React.useState('padrão');
  const [radius, setRadius] = React.useState('moderno');
  const [containerStyle, setContainerStyle] = React.useState('moderno');
  const [backgroundTexture, setBackgroundTexture] = React.useState('none');
  const [colorIntensity, setColorIntensity] = React.useState('equilibrada');
  const [animationStyle, setAnimationStyle] = React.useState('sutil');
  const [fontStyle, setFontStyle] = React.useState('moderno');
  const [sidebarStyle, setSidebarStyle] = React.useState('padrão');
  const [statusColors, setStatusColors] = React.useState<Record<string, string>>({});
  const [isMounted, setIsMounted] = React.useState(false);
  const { resolvedTheme } = useNextTheme();

  React.useEffect(() => {
    setIsMounted(true);
    const getSaved = (key: string, def: string) => {
        if (typeof window === 'undefined') return def;
        return localStorage.getItem(key) || def;
    };

    setColorTheme(getSaved("lk-color-theme", "padrão"));
    setRadius(getSaved("lk-radius-theme", "moderno"));
    setContainerStyle(getSaved("lk-container-style", "moderno"));
    setBackgroundTexture(getSaved("lk-texture-theme", "none"));
    setColorIntensity(getSaved("lk-intensity-theme", "equilibrada"));
    setAnimationStyle(getSaved("lk-animation-theme", "sutil"));
    setFontStyle(getSaved("lk-font-theme", "moderno"));
    setSidebarStyle(getSaved("lk-sidebar-style", "padrão"));
    
    const savedStatusColors = localStorage.getItem("lk-status-colors");
    if (savedStatusColors) {
        try { setStatusColors(JSON.parse(savedStatusColors)); } catch(e) {}
    }
  }, []);

  React.useLayoutEffect(() => {
    if (isMounted) {
      const root = document.documentElement;
      
      const activeTheme = THEMES.find(t => t.name === colorTheme) || THEMES[0];
      const primaryValue = resolvedTheme === 'dark' ? activeTheme.dark : activeTheme.light;
      root.style.setProperty('--primary', primaryValue);
      localStorage.setItem("lk-color-theme", colorTheme);

      const clearAndAdd = (list: string[], prefix: string, current: string) => {
          root.classList.remove(...list.map(item => `${prefix}-${item}`));
          root.classList.add(`${prefix}-${current}`);
          localStorage.setItem(`lk-${prefix}-theme`, current);
      };

      clearAndAdd(RADIUS_OPTIONS, "radius", radius);
      clearAndAdd(CONTAINER_STYLES, "style", containerStyle);
      clearAndAdd(TEXTURE_OPTIONS, "texture", backgroundTexture);
      clearAndAdd(INTENSITY_OPTIONS, "intensity", colorIntensity);
      clearAndAdd(ANIMATION_OPTIONS, "anim", animationStyle);
      
      root.classList.remove(...FONT_OPTIONS.map(f => `font-${f}`));
      root.classList.add(`font-${fontStyle}`);
      localStorage.setItem("lk-font-theme", fontStyle);

      root.classList.remove(...SIDEBAR_OPTIONS.map(s => `sidebar-${s}`));
      root.classList.add(`sidebar-${sidebarStyle}`);
      localStorage.setItem("lk-sidebar-style", sidebarStyle);

      localStorage.setItem("lk-status-colors", JSON.stringify(statusColors));
    }
  }, [colorTheme, radius, containerStyle, backgroundTexture, colorIntensity, animationStyle, fontStyle, sidebarStyle, statusColors, isMounted, resolvedTheme]);

  const value = React.useMemo(() => ({
    colorTheme, setColorTheme,
    radius, setRadius,
    containerStyle, setContainerStyle,
    backgroundTexture, setBackgroundTexture,
    colorIntensity, setColorIntensity,
    animationStyle, setAnimationStyle,
    fontStyle, setFontStyle,
    sidebarStyle, setSidebarStyle,
    statusColors, setStatusColors
  }), [colorTheme, radius, containerStyle, backgroundTexture, colorIntensity, animationStyle, fontStyle, sidebarStyle, statusColors]);

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ColorThemeProvider>
        {children}
      </ColorThemeProvider>
    </NextThemesProvider>
  )
}

export function useTheme() {
    const nextThemeContext = useNextTheme();
    const colorThemeContext = React.useContext(ColorThemeContext);

    if (colorThemeContext === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return React.useMemo(() => ({
        ...nextThemeContext,
        ...colorThemeContext
    }), [nextThemeContext, colorThemeContext]);
}
