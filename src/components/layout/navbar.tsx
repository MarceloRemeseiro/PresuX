"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const { user, profile, signOut, isLoading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    // router.push('/'); // Opcional: redirigir a la home page tras logout
  };
  
  // TODO: Implementar login con OAuth (Google, GitHub, etc.) si se desea.
  // const handleOAuthLogin = async (provider: '''google''' | '''github''') => {
  //   const { error } = await supabase.auth.signInWithOAuth({
  //     provider,
  //     options: {
  //       redirectTo: window.location.origin + '/auth/callback', // Asegúrate que esta ruta de callback esté configurada
  //     },
  //   });
  //   if (error) console.error(`Error con ${provider} login:`, error.message);
  // };


  return (
    <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          {/* <Icons.logo className="h-6 w-6" /> Reemplazar con tu logo si tienes */}
          <span className="font-bold sm:inline-block">
            PresuX
          </span>
        </Link>
        
        <nav className="flex flex-1 items-center space-x-4 lg:space-x-6">
          {/* Aquí podrías añadir más enlaces de navegación si el usuario está logueado */}
          {user && (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]">
                Dashboard
              </Link>
              <Link href="/clientes" className="text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]">
                Clientes
              </Link>
              <Link href="/proveedores" className="text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]">
                Proveedores
              </Link>
              {/* Más enlaces... Presupuestos, Facturas, etc. */}
            </>
          )}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-[hsl(var(--muted))]"></div>
          ) : user ? (
            <>
              <span className="text-sm font-medium">
                {profile?.nombre_completo || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/signup">Registrarse</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 