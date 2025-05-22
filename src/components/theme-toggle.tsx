"use client";

import * as React from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cambiar a tema claro"
        className={theme === "light" ? "bg-accent" : ""}
        onClick={() => setTheme("light")}
      >
        <Sun className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cambiar a tema oscuro"
        className={theme === "dark" ? "bg-accent" : ""}
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Usar tema del sistema"
        className={theme === "system" ? "bg-accent" : ""}
        onClick={() => setTheme("system")}
      >
        <Laptop className="h-5 w-5" />
      </Button>
    </div>
  );
} 