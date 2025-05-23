"use client";

import { useState } from "react";
import { Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";

interface ConfigItemWithPrice {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio_dia: number;
  productCount?: number;
}

interface ConfigTableWithPriceProps<T extends ConfigItemWithPrice> {
  items: T[];
  itemType: string;
  itemTypePlural: string;
  apiEndpoint: string; // "/api/servicios" o "/api/puestos-trabajo"
  onDelete: (item: T) => void;
  onUpdate: (updatedItem: T) => void;
  CreateModal: React.ComponentType<{ onItemCreated: (item: T) => void }>;
  onItemCreated: (item: T) => void;
}

export function ConfigTableWithPrice<T extends ConfigItemWithPrice>({
  items,
  itemType,
  itemTypePlural,
  apiEndpoint,
  onDelete,
  onUpdate,
  CreateModal,
  onItemCreated,
}: ConfigTableWithPriceProps<T>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ nombre: string; precio_dia: number; descripcion: string }>({
    nombre: '',
    precio_dia: 0,
    descripcion: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const unusedCount = items.filter(item => item.productCount === 0).length;

  const startEdit = (item: T) => {
    setEditingId(item.id);
    setEditValues({
      nombre: item.nombre,
      precio_dia: item.precio_dia,
      descripcion: item.descripcion || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ nombre: '', precio_dia: 0, descripcion: '' });
  };

  const saveEdit = async (item: T) => {
    if (!editValues.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (editValues.precio_dia < 0) {
      toast.error('El precio debe ser mayor o igual a 0');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await apiClient<{ [key: string]: T }>(`${apiEndpoint}/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: editValues.nombre.trim(),
          precio_dia: editValues.precio_dia,
          descripcion: editValues.descripcion.trim() || null
        }),
      });

      // La respuesta puede tener diferentes keys (servicio, puestoTrabajo)
      const updatedItem = Object.values(response)[0] as T;
      onUpdate(updatedItem);
      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} actualizado correctamente`);
      setEditingId(null);
    } catch (error: any) {
      console.error('Error actualizando:', error);
      const errorMessage = error?.message || `Error al actualizar el ${itemType}`;
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {items.length} {items.length === 1 ? itemType : itemTypePlural}
          {items.length > 0 && ` • ${unusedCount} sin usar`}
        </div>
        <CreateModal onItemCreated={onItemCreated} />
      </div>
      
      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No hay {itemTypePlural} creados aún
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                {editingId === item.id ? (
                  // Modo edición
                  <div className="space-y-2">
                    <Input
                      value={editValues.nombre}
                      onChange={(e) => setEditValues(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Nombre"
                      className="text-sm"
                      maxLength={255}
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          min="0"
                          max="99999.99"
                          step="0.01"
                          value={editValues.precio_dia}
                          onChange={(e) => setEditValues(prev => ({ 
                            ...prev, 
                            precio_dia: parseFloat(e.target.value) || 0 
                          }))}
                          placeholder="Precio por día"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <textarea
                      value={editValues.descripcion}
                      onChange={(e) => setEditValues(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Descripción (opcional)"
                      className="w-full text-xs p-2 border rounded resize-none"
                      rows={2}
                      maxLength={1000}
                    />
                  </div>
                ) : (
                  // Modo visualización
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.nombre}</span>
                      <span className="font-semibold text-sm text-green-600">
                        {formatPrice(item.precio_dia)}/día
                      </span>
                    </div>
                    {item.descripcion && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.descripcion}</p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {item.productCount === 0 
                        ? 'No se usa en presupuestos' 
                        : `Usado en ${item.productCount} presupuesto${item.productCount === 1 ? '' : 's'}`
                      }
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 ml-3">
                {editingId === item.id ? (
                  // Botones de edición
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => saveEdit(item)}
                      disabled={isUpdating}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={cancelEdit}
                      disabled={isUpdating}
                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  // Botones normales
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(item)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item)}
                      className={
                        !!(item.productCount && item.productCount > 0)
                          ? 'text-gray-400 cursor-not-allowed h-8 w-8'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8'
                      }
                      disabled={!!(item.productCount && item.productCount > 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
} 