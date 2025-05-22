"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (signInError) {
      if (signInError.message === "Email not confirmed") {
        setError("Tu correo electrónico aún no ha sido confirmado. Por favor, revisa tu bandeja de entrada.");
      } else if (signInError.message === "Invalid login credentials") {
        setError("Correo electrónico o contraseña incorrectos.");
      }
      else {
        setError(signInError.message);
      }
    } else {
      if (redirectTo && redirectTo.startsWith("/")) {
        router.push(redirectTo);
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center [padding:calc(var(--spacing)*6)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico y contraseña para acceder a tu cuenta.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                Correo Electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch">
            {error && <p className="mb-4 text-sm text-red-600 bg-red-100 border border-red-300 p-3 rounded-md">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm">
        ¿No tienes una cuenta?{" "}
        <a href="/signup" className="font-medium text-[hsl(var(--primary))] hover:underline">
          Regístrate aquí
        </a>
      </p>
    </main>
  );
} 