"use client";

import React from 'react';
import { cn } from '@/lib/utils';
// import { EstadoCliente, EstadoProveedor } from './contador'; // Eliminadas, no se usan aquí

// S ahora se espera que sea string o un subtipo de string
interface ContadorSimpleProps<T, S extends string> {
  items: T[];                                   // Todos los items para calcular los conteos
  tipo: "factura" | "presupuesto" | "gasto" | "cliente" | "categoria" | "proveedor" | "personal";
  getEstadoFn: (item: T) => S;                  // Función para obtener el estado de un item
  className?: string;                           // Clase adicional para personalizar estilos
}

export function ContadorSimple<T, S extends string>({ 
  items,
  tipo,
  getEstadoFn,
  className
}: ContadorSimpleProps<T, S>) {
  // Calcular conteos de cada estado basados en los items proporcionados
  const counts = items.reduce((acc, item) => {
    const estado = getEstadoFn(item);
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {} as Record<S, number>);

  // Definir los estados posibles según el tipo
  let estadosPosibles: S[] = [];
  
  if (tipo === "cliente") {
    estadosPosibles = ["PARTICULAR", "EMPRESA", "AUTONOMO"] as S[];
  } else if (tipo === "proveedor") {
    estadosPosibles = ["BIENES", "SERVICIOS", "MIXTO"] as S[];
  } else if (tipo === "personal") {
    estadosPosibles = ["activo", "inactivo"] as S[];
  } else if (tipo === "factura" || tipo === "presupuesto") {
    estadosPosibles = ["PENDIENTE", "ACEPTADO", "RECHAZADO", "PAGADO"] as S[];
  } else if (tipo === "gasto") {
    estadosPosibles = ["PENDIENTE", "PAGADO"] as S[];
  } else {
    estadosPosibles = Object.keys(counts) as S[];
  }
  
  // Filtrar para mostrar solo los estados que tienen al menos un elemento
  const estadosConDatos = estadosPosibles.filter(estado => counts[estado] && counts[estado] > 0);
  
  return (
    <div className={cn("flex flex-wrap gap-3 mt-1", className)}>
      {/* Total de elementos */}
      <div className="px-3 py-1.5 rounded-md text-gray-800 bg-gray-100 text-sm font-medium">
        Total: {items.length}
      </div>
      
      {/* Contador por tipo */}
      {estadosConDatos.map(estado => (
        <div 
          key={estado} 
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium",
            tipo === "cliente" && estado === "EMPRESA" && "bg-blue-100 text-blue-800",
            tipo === "cliente" && estado === "AUTONOMO" && "bg-yellow-100 text-yellow-800",
            tipo === "cliente" && estado === "PARTICULAR" && "bg-green-100 text-green-800",
            tipo === "factura" && estado === "PENDIENTE" && "bg-orange-100 text-orange-800",
            tipo === "factura" && estado === "PAGADO" && "bg-green-100 text-green-800",
            tipo === "factura" && estado === "RECHAZADO" && "bg-red-100 text-red-800",
            tipo === "factura" && estado === "ACEPTADO" && "bg-blue-100 text-blue-800",
            tipo === "presupuesto" && estado === "PENDIENTE" && "bg-orange-100 text-orange-800",
            tipo === "presupuesto" && estado === "ACEPTADO" && "bg-green-100 text-green-800",
            tipo === "presupuesto" && estado === "RECHAZADO" && "bg-red-100 text-red-800",
            tipo === "gasto" && estado === "PENDIENTE" && "bg-orange-100 text-orange-800",
            tipo === "gasto" && estado === "PAGADO" && "bg-green-100 text-green-800",
            tipo === "proveedor" && estado === "BIENES" && "bg-blue-100 text-blue-800",
            tipo === "proveedor" && estado === "SERVICIOS" && "bg-green-100 text-green-800",
            tipo === "proveedor" && estado === "MIXTO" && "bg-purple-100 text-purple-800",
            tipo === "personal" && estado === "activo" && "bg-green-100 text-green-800",
            tipo === "personal" && estado === "inactivo" && "bg-red-100 text-red-800"
          )}
        >
          {estado}: {counts[estado]}
        </div>
      ))}
    </div>
  );
} 