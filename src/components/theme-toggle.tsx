"use client"

import * as React from "react"
import { Laptop, Moon, Sun } from "lucide-react"
import { useTheme as useNextTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useNextTheme()

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Tema</h4>
      <div className="flex items-center space-x-2">
        <Button
          variant={theme === 'light' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setTheme("light")}
        >
          <Sun className="mr-2 h-4 w-4" />
          Claro
        </Button>
        <Button
          variant={theme === 'dark' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setTheme("dark")}
        >
          <Moon className="mr-2 h-4 w-4" />
          Escuro
        </Button>
        <Button
          variant={theme === 'system' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setTheme("system")}
        >
          <Laptop className="mr-2 h-4 w-4" />
          Sistema
        </Button>
      </div>
    </div>
  )
}
