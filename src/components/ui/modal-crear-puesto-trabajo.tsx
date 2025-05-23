"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import type { PuestoTrabajo } from "@/types/puesto-trabajo";

interface ModalCrearPuestoTrabajoProps {
  onPuestoTrabajoCreated: (puestoTrabajo: PuestoTrabajo) => void;
}

export function ModalCrearPuestoTrabajo({ onPuestoTrabajoCreated }: ModalCrearPuestoTrabajoProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_dia: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre del puesto es obligatorio');
      return;
    }

    if (formData.precio_dia < 0) {
      toast.error('El precio por día debe ser mayor o igual a 0');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiClient<{ puestoTrabajo: PuestoTrabajo }>('/api/puestos-trabajo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || null,
          precio_dia: formData.precio_dia
        }),
      });

      onPuestoTrabajoCreated(response.puestoTrabajo);
      toast.success('Puesto de trabajo creado exitosamente');
      
      // Limpiar formulario y cerrar modal
      setFormData({ nombre: '', descripcion: '', precio_dia: 0 });
      setOpen(false);
      
    } catch (error: any) {
      console.error('Error creando puesto de trabajo:', error);
      const errorMessage = error?.message || 'Error al crear el puesto de trabajo';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ nombre: '', descripcion: '', precio_dia: 0 });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Puesto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Puesto de Trabajo</DialogTitle>
            <DialogDescription>
              Agrega un nuevo puesto de trabajo profesional a tu catálogo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="nombre" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Nombre del puesto *
              </label>
              <Input
                id="nombre"
                placeholder="ej. Operador de Cámara"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                required
                maxLength={255}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="descripcion" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Descripción
              </label>
              <textarea
                id="descripcion"
                placeholder="Describe las responsabilidades y requisitos del puesto..."
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                maxLength={1000}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="precio_dia" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Precio por día (€) *
              </label>
              <Input
                id="precio_dia"
                type="number"
                min="0"
                max="99999.99"
                step="0.01"
                placeholder="0.00"
                value={formData.precio_dia}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  precio_dia: parseFloat(e.target.value) || 0 
                }))}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear Puesto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 