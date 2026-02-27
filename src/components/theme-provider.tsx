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
const AURA_OPTIONS = ["limpo", "nebula", "aurora", "sunset", "ocean", "lavender", "mint", "pearl", "desert", "velvet"];

const DEFAULT_STATUS_COLORS: Record<string, string> = {
    // 🛡️ DISTINÇÃO VISUAL: Diferenciamos o Contrato Pago ao Cliente da Comissão Recebida pelo Agente
    "PAGO": "142 76% 36%", // Verde Esmeralda (Contrato Finalizado)
    "PAGA": "173 80% 40%", // Verde Azulado/Teal (Comissão Recebida)
    
    "SALDO PAGO": "24 95% 53%",
    "EM ANDAMENTO": "45 93% 47%",
    "AGUARDANDO SALDO": "217 91% 60%",
    "REPROVADO": "0 72% 50%",
    "PENDENTE": "280 78% 51%",
    "PARCIAL": "199 89% 48%",
    "ATIVO": "142 76% 36%",
    "ACTIVE": "142 76% 36%",
    "INATIVO": "240 5% 65%",
    "INACTIVE": "240 5% 65%"
};

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
  auraStyle: string;
  setAuraStyle: (a: string) => void;
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
  const [auraStyle, setAuraStyle] = React.useState('limpo');
  const [statusColors, setStatusColors] = React.useState<Record<string, string>>(DEFAULT_STATUS_COLORS);
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
    setAuraStyle(getSaved("lk-aura-style", "limpo"));
    
    const savedStatusColors = localStorage.getItem("lk-status-colors");
    if (savedStatusColors) {
        try { 
            const parsed = JSON.parse(savedStatusColors);
            setStatusColors({ ...DEFAULT_STATUS_COLORS, ...parsed }); 
        } catch(e) {
            setStatusColors(DEFAULT_STATUS_COLORS);
        }
    }
  }, []);

  React.useEffect(() => {
    if (isMounted) {
      const root = document.documentElement;
      
      const activeTheme = THEMES.find(t => t.name === colorTheme) || THEMES[0];
      const primaryValue = resolvedTheme === 'dark' ? activeTheme.dark : activeTheme.light;
      root.style.setProperty('--primary', primaryValue);

      const applyClass = (list: string[], prefix: string, current: string) => {
          list.forEach(opt => root.classList.remove(`${prefix}-${opt}`));
          if (current && current !== 'none' && current !== 'padrão' && current !== 'limpo') {
            root.classList.add(`${prefix}-${current}`);
          }
      };

      applyClass(RADIUS_OPTIONS, "radius", radius);
      applyClass(CONTAINER_STYLES, "style", containerStyle);
      applyClass(TEXTURE_OPTIONS, "texture", backgroundTexture);
      applyClass(INTENSITY_OPTIONS, "intensity", colorIntensity);
      applyClass(ANIMATION_OPTIONS, "anim", animationStyle);
      applyClass(FONT_OPTIONS, "font", fontStyle);
      applyClass(AURA_OPTIONS, "aura", auraStyle);
      
      SIDEBAR_OPTIONS.forEach(s => root.classList.remove(`sidebar-${s}`));
      if (sidebarStyle !== 'padrão') {
        root.classList.add(`sidebar-${sidebarStyle}`);
      }
    }
  }, [colorTheme, radius, containerStyle, backgroundTexture, colorIntensity, animationStyle, fontStyle, sidebarStyle, auraStyle, isMounted, resolvedTheme]);

  const value = React.useMemo(() => ({
    colorTheme, setColorTheme: (val: string) => { setColorTheme(val); localStorage.setItem("lk-color-theme", val); },
    radius, setRadius: (val: string) => { setRadius(val); localStorage.setItem("lk-radius-theme", val); },
    containerStyle, setContainerStyle: (val: string) => { setContainerStyle(val); localStorage.setItem("lk-container-style", val); },
    backgroundTexture, setBackgroundTexture: (val: string) => { setBackgroundTexture(val); localStorage.setItem("lk-texture-theme", val); },
    colorIntensity, setColorIntensity: (val: string) => { setColorIntensity(val); localStorage.setItem("lk-intensity-theme", val); },
    animationStyle, setAnimationStyle: (val: string) => { setAnimationStyle(val); localStorage.setItem("lk-animation-theme", val); },
    fontStyle, setFontStyle: (val: string) => { setFontStyle(val); localStorage.setItem("lk-font-theme", val); },
    sidebarStyle, setSidebarStyle: (val: string) => { setSidebarStyle(val); localStorage.setItem("lk-sidebar-style", val); },
    auraStyle, setAuraStyle: (val: string) => { setAuraStyle(val); localStorage.setItem("lk-aura-style", val); },
    statusColors, setStatusColors: (val: Record<string, string>) => { setStatusColors(val); localStorage.setItem("lk-status-colors", JSON.stringify(val)); }
  }), [colorTheme, radius, containerStyle, backgroundTexture, colorIntensity, animationStyle, fontStyle, sidebarStyle, auraStyle, statusColors]);

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
