import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between [padding:calc(var(--spacing)*24)]">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 [padding-block-start:calc(var(--spacing)*8)] [padding-block-end:calc(var(--spacing)*6)] backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:[padding:calc(var(--spacing)*4)] lg:dark:bg-zinc-800/30">
          PresuX - Gestión de Presupuestos y Facturas
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <ThemeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Presupuestos</CardTitle>
            <CardDescription>Gestiona tus presupuestos</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Crea, edita y envía presupuestos a tus clientes de forma rápida y sencilla.</p>
          </CardContent>
          <CardFooter>
            <Button variant="presupuesto">Nuevo Presupuesto</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facturas</CardTitle>
            <CardDescription>Gestiona tus facturas</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Genera facturas automáticamente a partir de presupuestos o crea nuevas facturas.</p>
          </CardContent>
          <CardFooter>
            <Button variant="factura">Nueva Factura</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Gestiona tus clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Administra la información de tus clientes y accede a su historial de presupuestos y facturas.</p>
          </CardContent>
          <CardFooter>
            <Button>Nuevo Cliente</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">Variantes de botones</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="factura">Factura</Button>
          <Button variant="presupuesto">Presupuesto</Button>
        </div>
      </div>
    </main>
  );
}
