
"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { useUser, useFirestore, useMemoFirebase } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"

const themes = [
    { name: "padrão", label: "Padrão", light: "hsl(217 33% 25%)", dark: "hsl(217 33% 30%)" },
    { name: "zinc", label: "Cinza", light: "hsl(240 5.9% 10%)", dark: "hsl(240 5.9% 90%)" },
    { name: "midnight", label: "Meia-Noite", light: "hsl(222 47% 11%)", dark: "hsl(222 47% 11%)" },
    { name: "obsidian", label: "Obsidiana", light: "hsl(240 10% 10%)", dark: "hsl(240 10% 10%)" },
    { name: "charcoal", label: "Carvão", light: "hsl(210 10% 20%)", dark: "hsl(210 10% 20%)" },
    { name: "slate", label: "Ardósia", light: "hsl(215 25% 27%)", dark: "hsl(215 25% 67%)" },
    { name: "titanium", label: "Titânio", light: "hsl(210 5% 30%)", dark: "hsl(210 5% 35%)" },
    { name: "industrial", label: "Industrial", light: "hsl(200 5% 45%)", dark: "hsl(200 5% 50%)" },
    { name: "graphite", label: "Grafite", light: "hsl(215 15% 35%)", dark: "hsl(215 15% 40%)" },
    { name: "blue", label: "Azul", light: "hsl(217.2 91.2% 59.8%)", dark: "hsl(217.2 91.2% 59.8%)" },
    { name: "nordic", label: "Nórdico", light: "hsl(210 20% 40%)", dark: "hsl(210 20% 45%)" },
    { name: "royal-blue", label: "Royal", light: "hsl(225 73% 45%)", dark: "hsl(225 73% 50%)" },
    { name: "sky-blue", label: "Azul Céu", light: "hsl(199 89% 48%)", dark: "hsl(199 89% 53%)" },
    { name: "arctic", label: "Ártico", light: "hsl(195 90% 45%)", dark: "hsl(195 90% 50%)" },
    { name: "ocean", label: "Oceano", light: "hsl(210 100% 25%)", dark: "hsl(210 100% 30%)" },
    { name: "indigo", label: "Índigo", light: "hsl(243 75% 59%)", dark: "hsl(243 75% 59%)" },
    { name: "purple", label: "Roxo", light: "hsl(282 78% 51%)", dark: "hsl(282 78% 56%)" },
    { name: "deep-purple", label: "Plum", light: "hsl(275 80% 35%)", dark: "hsl(275 80% 40%)" },
    { name: "amethyst", label: "Ametista", light: "hsl(275 70% 55%)", dark: "hsl(275 70% 60%)" },
    { name: "violet", label: "Violeta", light: "hsl(262.1 83.3% 57.8%)", dark: "hsl(262.1 83.3% 62.8%)" },
    { name: "lavender", label: "Lavanda", light: "hsl(250, 60%, 60%)", dark: "hsl(250, 60%, 65%)" },
    { name: "pink", label: "Pink", light: "hsl(336 82% 54%)", dark: "hsl(336 82% 59%)" },
    { name: "magenta", label: "Magenta", light: "hsl(322 84% 50%)", dark: "hsl(322 84% 55%)" },
    { name: "berry", label: "Frutas", light: "hsl(330 80% 40%)", dark: "hsl(330 80% 45%)" },
    { name: "rose", label: "Rosa", light: "hsl(346.8 77.2% 49.8%)", dark: "hsl(346.8 77.2% 54.8%)" },
    { name: "wine", label: "Vinho", light: "hsl(345 60% 25%)", dark: "hsl(345 60% 25%)" },
    { name: "claret", label: "Bordeaux", light: "hsl(345 60% 30%)", dark: "hsl(345 60% 35%)" },
    { name: "cherry", label: "Cereja", light: "hsl(350 85% 40%)", dark: "hsl(350 85% 45%)" },
    { name: "ruby", label: "Rubi", light: "hsl(355 100% 45%)", dark: "hsl(355 100% 50%)" },
    { name: "crimson", label: "Carmesim", light: "hsl(348 83% 47%)", dark: "hsl(348 83% 52%)" },
    { name: "red", label: "Vermelho", light: "hsl(0 72.2% 50.6%)", dark: "hsl(0 72.2% 55.6%)" },
    { name: "volcano", label: "Vulcão", light: "hsl(10 80% 45%)", dark: "hsl(10 80% 50%)" },
    { name: "burnt-orange", label: "Burnt", light: "hsl(16 84% 44%)", dark: "hsl(16 84% 49%)" },
    { name: "rust", label: "Ferrugem", light: "hsl(15 75% 45%)", dark: "hsl(15 75% 50%)" },
    { name: "terracotta", label: "Argila", light: "hsl(15 65% 50%)", dark: "hsl(15 65% 55%)" },
    { name: "orange", label: "Laranja", light: "hsl(24.6 95% 53.1%)", dark: "hsl(24.6 95% 58.1%)" },
    { name: "amber", label: "Âmbar", light: "hsl(38 92% 50%)", dark: "hsl(38 92% 50%)" },
    { name: "copper", label: "Cobre", light: "hsl(25 65% 45%)", dark: "hsl(25 65% 50%)" },
    { name: "yellow", label: "Amarelo", light: "hsl(45 93% 47%)", dark: "hsl(45 93% 52%)" },
    { name: "mustard", label: "Mostarda", light: "hsl(45 95% 45%)", dark: "hsl(45 95% 50%)" },
    { name: "gold", label: "Ouro", light: "hsl(45 80% 40%)", dark: "hsl(45 80% 40%)" },
    { name: "royal-gold", label: "Ouro Real", light: "hsl(45 90% 35%)", dark: "hsl(45 90% 40%)" },
    { name: "coffee", label: "Café", light: "hsl(25 30% 20%)", dark: "hsl(25 30% 20%)" },
    { name: "espresso", label: "Expresso", light: "hsl(15 20% 15%)", dark: "hsl(15 20% 15%)" },
    { name: "bronze", label: "Bronze", light: "hsl(30 40% 40%)", dark: "hsl(30 40% 40%)" },
    { name: "sand", label: "Areia", light: "hsl(40 50% 65%)", dark: "hsl(40 50% 70%)" },
    { name: "peach", label: "Pêssego", light: "hsl(29, 100%, 65%)", dark: "hsl(29, 100%, 70%)" },
    { name: "green", label: "Verde", light: "hsl(142.1 76.2% 36.3%)", dark: "hsl(142.1 76.2% 41.3%)" },
    { name: "forest", label: "Floresta", light: "hsl(145 63% 22%)", dark: "hsl(145 63% 22%)" },
    { name: "sage", label: "Sálvia", light: "hsl(120 15% 45%)", dark: "hsl(120 15% 50%)" },
    { name: "olive", label: "Oliveira", light: "hsl(80 50% 35%)", dark: "hsl(80 50% 40%)" },
    { name: "forest-bright", label: "Mata", light: "hsl(145 80% 35%)", dark: "hsl(145 80% 40%)" },
    { name: "emerald", label: "Esmeralda", light: "hsl(158 78% 41%)", dark: "hsl(158 78% 46%)" },
    { name: "emerald-vivid", label: "Esmeralda V.", light: "hsl(150 100% 40%)", dark: "hsl(150 100% 45%)" },
    { name: "mint", label: "Menta", light: "hsl(168, 86%, 44%)", dark: "hsl(168 86% 49%)" },
    { name: "teal", label: "Teal", light: "hsl(173 80% 40%)", dark: "hsl(173 80% 40%)" },
    { name: "cyan", label: "Ciano", light: "hsl(184 90% 41%)", dark: "hsl(184 90% 46%)" },
    { name: "lime", label: "Lima", light: "hsl(85 90% 40%)", dark: "hsl(85 90% 45%)" },
    { name: "silver", label: "Prata", light: "hsl(210 15% 65%)", dark: "hsl(210 15% 75%)" },
    { name: "gray", label: "Grafite", light: "hsl(220 9% 46%)", dark: "hsl(220 9% 51%)" },
    { name: "electric", label: "Elétrico", light: "hsl(230 100% 60%)", dark: "hsl(230 100% 65%)" },
];


export function ThemeColors() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { setColorTheme, colorTheme, resolvedTheme } = useTheme();

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);

  const handleThemeChange = async (themeName: string) => {
    setColorTheme(themeName);
    if (settingsDocRef) {
        try {
            await setDoc(settingsDocRef, { colorTheme: themeName }, { merge: true });
        } catch (e) {
            console.error("Error saving theme preference", e);
        }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Paleta de Cores Premium</h4>
        <p className="text-[10px] text-muted-foreground font-medium">Escolha a cor primária da sua marca (Aplicação Global).</p>
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-10 gap-3">
        {themes.map((theme) => {
          const isActive = colorTheme === theme.name
          const color = resolvedTheme === 'dark' ? theme.dark : theme.light
          return (
            <button
              key={theme.name}
              onClick={() => handleThemeChange(theme.name)}
              className={cn(
                "group relative flex h-10 w-full items-center justify-center rounded-lg border-2 transition-all hover:scale-110 active:scale-95",
                isActive ? "border-primary shadow-md ring-2 ring-primary/20" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
              title={theme.label}
            >
              {isActive && <Check className="h-5 w-5 text-white drop-shadow-md" />}
              <span className="sr-only">{theme.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
