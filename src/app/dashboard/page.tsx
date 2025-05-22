import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  // En el futuro, podríamos querer cargar datos específicos del dashboard aquí
  // const { user } = useAuth(); // Si fuera 'use client'
  // Por ahora, es un Server Component simple

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Bienvenido a PresuX</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Este es tu panel de control. Desde aquí podrás gestionar tus clientes, presupuestos, facturas y más.
          </p>
          {/* 
            Aquí podríamos añadir un resumen rápido:
            - Número de clientes
            - Presupuestos pendientes
            - Facturas por cobrar
            - etc.
          */}
        </CardContent>
      </Card>

      {/* Más cards o secciones podrían ir aquí */}
    </div>
  );
} 