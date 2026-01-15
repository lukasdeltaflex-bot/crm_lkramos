"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

const themes = [
  { name: "zinc", color: "hsl(240 5.9% 10%)" },
  { name: "blue", color: "hsl(217.2 91.2% 59.8%)" },
  { name: "green", color: "hsl(142.1 76.2% 36.3%)" },
  { name: "violet", color: "hsl(262.1 83.3% 57.8%)" },
  { name: "orange", color: "hsl(24.6 95% 53.1%)" },
  { name: "red", color: "hsl(0 84.2% 60.2%)" },
  { name: "rose", color: "hsl(346.8 77.2% 49.8%)" },
  { name: "gray", color: "hsl(220 9% 46%)" },
]

export function ThemeColors() {
  const { setColorTheme, colorTheme } = useTheme()

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Cor do Tema</h4>
      <div className="flex flex-wrap items-center gap-2">
        {themes.map((theme) => {
          const isActive = colorTheme === theme.name
          return (
            <button
              key={theme.name}
              onClick={() => setColorTheme(theme.name)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2 text-white",
                isActive ? "border-primary" : "border-transparent"
              )}
              style={{ backgroundColor: theme.color }}
            >
              {isActive && <Check className="h-5 w-5" />}
              <span className="sr-only">{theme.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
