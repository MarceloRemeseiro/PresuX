"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"; // Asumo que dialog.tsx existe o existirá en ui

interface ImportExportDialogProps {
  trigger: React.ReactNode;
  onImportSuccess: () => void;
}

export function ImportExportDialog({ trigger, onImportSuccess }: ImportExportDialogProps) {
  // Lógica para importar y exportar (a implementar)
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // TODO: Procesar el archivo CSV/Excel y llamar a la API para crear/actualizar clientes
    console.log("Archivo seleccionado para importar:", file.name);
    // Simular éxito de importación
    alert("Funcionalidad de importación en desarrollo.");
    onImportSuccess(); 
  };

  const handleExport = async () => {
    // TODO: Llamar a la API para obtener todos los clientes y generar un CSV/Excel
    alert("Funcionalidad de exportación en desarrollo.");
    console.log("Exportando datos...");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar / Exportar Clientes</DialogTitle>
          <DialogDescription>
            Importa clientes desde un archivo CSV o exporta tu lista actual.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <h3 className="mb-2 font-medium">Importar desde CSV</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Asegúrate que el archivo CSV tenga las columnas: nombre, tipo, nif, email, telefono, direccion, ciudad, persona_de_contacto.
            </p>
            {/* Input de archivo oculto, se activa con el botón */}
            <input type="file" id="importFile" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
            <Button variant="outline" onClick={() => document.getElementById('importFile')?.click()}>
              Seleccionar archivo CSV
            </Button>
          </div>
          <div>
            <h3 className="mb-2 font-medium">Exportar a CSV</h3>
            <Button variant="outline" onClick={handleExport}>
              Descargar CSV de Clientes
            </Button>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 