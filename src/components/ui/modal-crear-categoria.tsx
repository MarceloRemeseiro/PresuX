"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
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
import { ICategoriaProducto } from "@/types";

interface ModalCrearCategoriaProps {
  onCategoriaCreated: (categoria: ICategoriaProducto) => void;
}

export function ModalCrearCategoria({ onCategoriaCreated }: ModalCrearCategoriaProps) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      toast.error("El nombre de la categoría es obligatorio");
      return;
    }

    try {
      setIsCreating(true);
      
      const nuevaCategoria = await apiClient<ICategoriaProducto>('/api/categorias-producto', {
        method: "POST",
        body: { nombre: nombre.trim() }
      });
      
      toast.success("Categoría creada correctamente");
      onCategoriaCreated(nuevaCategoria);
      setNombre("");
      setOpen(false);
    } catch (err: unknown) {
      console.error("Error creando categoría:", err);
      const errorMessage = err instanceof Error ? err.message : "Error al crear la categoría";
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" type="button">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Categoría</DialogTitle>
          <DialogDescription>
            Crea una nueva categoría de producto que podrás usar inmediatamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="nombre" className="text-sm font-medium">
                Nombre de la categoría *
              </label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Cámaras, Iluminación..."
                disabled={isCreating}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNombre("");
                setOpen(false);
              }}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || !nombre.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Categoría"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 