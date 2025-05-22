"use client";

import * as React from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  attribute = "data-theme",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme);

  React.useEffect(() => {
    const root = window.document.documentElement;
    
    // Manejar transiciones
    if (disableTransitionOnChange) {
      root.classList.add("no-transitions");
      const timeout = setTimeout(() => {
        root.classList.remove("no-transitions");
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [disableTransitionOnChange]);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system" && enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      root.setAttribute(attribute, systemTheme);
      return;
    }

    root.classList.add(theme);
    root.setAttribute(attribute, theme);
  }, [theme, enableSystem, attribute]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: (theme: Theme) => {
        setTheme(theme);
        // Guardar la preferencia en localStorage
        try {
          localStorage.setItem("theme", theme);
        } catch (error) {
          console.error("Error al guardar el tema:", error);
        }
      },
    }),
    [theme]
  );

  // Recuperar el tema de localStorage al inicializar
  React.useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error("Error al recuperar el tema:", error);
    }
  }, []);

  // Escuchar cambios en las preferencias del sistema
  React.useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      if (theme === "system") {
        const root = window.document.documentElement;
        const systemTheme = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(systemTheme);
        root.setAttribute(attribute, systemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, attribute, enableSystem]);

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  }
  return context;
}; 