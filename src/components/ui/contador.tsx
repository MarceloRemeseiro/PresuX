"use client";

import React from 'react';

// Definición de los tipos de estado que se usarán en DataTableWithFilters
// Adaptado de tu docs/data-table-with-filters.tsx
export type EstadoCliente = "PARTICULAR" | "EMPRESA" | "AUTONOMO";
export type EstadoProveedor = "NACIONAL" | "INTERNACIONAL"; // Ejemplo, ajusta según necesidad

// Interfaz para las props del componente Contador
// (Esto es un placeholder, necesitará ser implementado según tu lógica de contador)
interface ContadorProps<T, S extends string | number | symbol> {
  items: T[];                                   // Todos los items para calcular los conteos totales
  tipo: "factura" | "presupuesto" | "gasto" | "cliente" | "categoria" | "proveedor" | "producto";
  onFilterChange: (estado: S | null) => void;   // Función para cambiar el filtro
  estadoActivo: S | null;                       // Filtro actualmente seleccionado
  getEstadoFn: (item: T) => S;                  // Función para obtener el estado de un item
  soloConteo?: boolean;                         // Si es true, solo muestra conteos sin filtrar (desactiva botones)
}

// Placeholder para el componente Contador
export function Contador<T, S extends string | number | symbol>({ 
  items,
  tipo,
  onFilterChange,
  estadoActivo,
  getEstadoFn,
  soloConteo = false
}: ContadorProps<T, S>) {
  // Calcular conteos de cada estado basados en TODOS los items proporcionados
  // Esto garantiza que los números siempre reflejen el total real
  if (tipo === "cliente" && getEstadoFn) {
    // Calcular conteos para cada tipo de cliente
    const counts = items.reduce((acc, item) => {
      const estado = getEstadoFn(item);
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {} as Record<S, number>);

    // Definir los estados posibles según el tipo
    const tiposCliente: EstadoCliente[] = ["PARTICULAR", "EMPRESA", "AUTONOMO"];
    
    return (
      <div className="flex space-x-2 p-2">
        <button 
          onClick={() => onFilterChange(null)} 
          className={`px-3 py-1 rounded-md text-sm ${
            !estadoActivo 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-accent'
          }`}
          disabled={soloConteo}
        >
          Todos ({items.length})
        </button>
        {tiposCliente.map((estado: EstadoCliente) => (
          <button 
            key={estado} 
            onClick={() => onFilterChange(estado as S)}
            className={`px-3 py-1 rounded-md text-sm ${
              estadoActivo === estado 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-accent'
            }`}
            disabled={soloConteo}
          >
            {estado} ({counts[estado as S] || 0})
          </button>
        ))}
      </div>
    );
  }

  // Para otros tipos de documentos, implementar lógica similar
  return <div className="p-2">Contador Placeholder para {tipo}</div>;
} 