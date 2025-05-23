"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfigItem {
  id: string;
  nombre: string;
  productCount?: number;
}

interface ConfigTableProps<T extends ConfigItem> {
  items: T[];
  itemType: string; // "categoría" o "marca"
  itemTypePlural: string; // "categorías" o "marcas"
  onDelete: (item: T) => void;
  CreateModal: React.ComponentType<{ onItemCreated: (item: T) => void }>;
  onItemCreated: (item: T) => void;
}

export function ConfigTable<T extends ConfigItem>({
  items,
  itemType,
  itemTypePlural,
  onDelete,
  CreateModal,
  onItemCreated,
}: ConfigTableProps<T>) {
  const unusedCount = items.filter(item => item.productCount === 0).length;

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
          No hay {itemTypePlural} creadas aún
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <span className="font-medium">{item.nombre}</span>
                <div className="text-xs text-gray-500 mt-1">
                  {item.productCount === 0 
                    ? 'No se usa en productos' 
                    : `Usada en ${item.productCount} producto${item.productCount === 1 ? '' : 's'}`
                  }
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item)}
                className={
                  !!(item.productCount && item.productCount > 0)
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                }
                disabled={!!(item.productCount && item.productCount > 0)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
} 