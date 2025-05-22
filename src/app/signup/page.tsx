"use client"; // Marcar como Client Component por el uso de hooks y manejo de eventos

import * as React from "react";
import { useRouter } from "next/navigation"; // Para redirección
import { supabase } from "@/lib/supabaseClient"; // Nuestro cliente Supabase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsLoading(false);
    if (signUpError) {
      if (signUpError.message.includes("User already registered")) {
        setError("Este correo electrónico ya está registrado. Por favor, intenta iniciar sesión.");
      } else {
        setError(signUpError.message);
      }
    } else if (data.user) {
        if (!data.session && data.user.identities && data.user.identities.length === 0) {
            setMessage("Este correo electrónico ya está registrado pero necesita ser confirmado. Por favor, revisa tu bandeja de entrada para un correo de confirmación anterior o intenta recuperar tu contraseña si crees que ya te habías registrado.");
        } else if (!data.session && data.user) {
            setMessage("¡Registro casi completo! Hemos enviado un correo de confirmación a tu dirección. Por favor, revisa tu bandeja de entrada (y la carpeta de spam) y haz clic en el enlace para activar tu cuenta. Serás redirigido a la página de inicio de sesión en unos segundos.");
            setTimeout(() => {
              router.push('/login');
            }, 7000);
        } else if (data.session) {
            setMessage("¡Registro exitoso! Redirigiendo al dashboard...");
            router.push('/dashboard');
        } else {
           setError("Ocurrió un error inesperado durante el registro. Por favor, inténtalo de nuevo.");
        }
    } else {
        setError("Ocurrió un error inesperado durante el registro. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center [padding:calc(var(--spacing)*6)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Crear una cuenta</CardTitle>
          <CardDescription>
            Ingresa tu correo electrónico y contraseña para registrarte.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
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
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                Confirmar Contraseña
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch">
            {error && <p className="mb-4 text-sm text-red-600 bg-red-100 border border-red-300 p-3 rounded-md">{error}</p>}
            {message && <p className="mb-4 text-sm text-green-600 bg-green-100 border border-green-300 p-3 rounded-md">{message}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Crear cuenta"}
            </Button>
          </CardFooter>
        </form>
      </Card>
       <p className="mt-4 text-center text-sm">
        ¿Ya tienes una cuenta?{" "}
        <a href="/login" className="font-medium text-[hsl(var(--primary))] hover:underline">
          Inicia sesión aquí
        </a>
      </p>
    </main>
  );
} 