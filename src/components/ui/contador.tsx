"use client";

import React from 'react';

// Definición de los tipos de estado que se usarán en DataTableWithFilters
// Adaptado de tu docs/data-table-with-filters.tsx
export type EstadoCliente = "PARTICULAR" | "EMPRESA" | "AUTONOMO";
export type EstadoProveedor = "NACIONAL" | "INTERNACIONAL"; // Ejemplo, ajusta según necesidad
export type EstadoPuesto = string; // Los puestos serán strings dinámicos

// Interfaz para las props del componente Contador
// (Esto es un placeholder, necesitará ser implementado según tu lógica de contador)
interface ContadorProps<T, S extends string | number | symbol> {
  items: T[];                                   // Todos los items para calcular los conteos totales
  tipo: "factura" | "presupuesto" | "gasto" | "cliente" | "categoria" | "proveedor" | "producto" | "personal";
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

  if (tipo === "personal") {
    // Para personal, extraer todos los puestos únicos
    const puestosSet = new Set<string>();
    const puestoPersonalMap = new Map<string, number>();
    
    items.forEach((item: any) => {
      if (item.puestos_trabajo && Array.isArray(item.puestos_trabajo)) {
        item.puestos_trabajo.forEach((puesto: any) => {
          const nombrePuesto = puesto.nombre_puesto;
          puestosSet.add(nombrePuesto);
          puestoPersonalMap.set(nombrePuesto, (puestoPersonalMap.get(nombrePuesto) || 0) + 1);
        });
      }
    });

    const puestos = Array.from(puestosSet).sort();
    
    // Función para generar colores consistentes para cada puesto
    const generatePuestoColor = (puestoNombre: string): string => {
      const colors = [
        'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        'bg-green-100 text-green-800 border-green-200 hover:bg-green-200', 
        'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
        'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
        'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200',
        'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
        'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200',
        'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
        'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200'
      ];
      
      // Generar un hash simple del nombre para conseguir consistencia
      let hash = 0;
      for (let i = 0; i < puestoNombre.length; i++) {
        const char = puestoNombre.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return colors[Math.abs(hash) % colors.length];
    };
    
    return (
      <div className="flex flex-wrap gap-2 p-2">
        <button 
          onClick={() => onFilterChange(null)} 
          className={`px-3 py-1 rounded-md text-sm border transition-colors ${
            !estadoActivo 
              ? 'bg-gray-900 text-white border-gray-900' 
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
          }`}
          disabled={soloConteo}
        >
          Todos ({items.length})
        </button>
        {puestos.map((puesto) => {
          const colorClasses = generatePuestoColor(puesto);
          const count = puestoPersonalMap.get(puesto) || 0;
          
          return (
            <button 
              key={puesto} 
              onClick={() => onFilterChange(puesto as S)}
              className={`px-3 py-1 rounded-md text-sm border transition-colors ${
                estadoActivo === puesto 
                  ? `${colorClasses} ring-2 ring-offset-1 ring-gray-400` 
                  : `${colorClasses} opacity-80 hover:opacity-100`
              }`}
              disabled={soloConteo}
            >
              {puesto} ({count})
            </button>
          );
        })}
      </div>
    );
  }

  // Para otros tipos de documentos, implementar lógica similar
  return <div className="p-2">Contador Placeholder para {tipo}</div>;
} 