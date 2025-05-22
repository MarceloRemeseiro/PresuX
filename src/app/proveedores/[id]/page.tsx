"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Loader2, Edit, Trash, 
  Building, UserRound, Briefcase, // Iconos de tipo (Briefcase para SERVICIOS, UserRound para MIXTO si se quiere diferenciar de cliente particular)
  Mail, Phone, MapPin, FileEdit, Clock, Info // Iconos de detalle
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/apiClient";
import { IProveedor, TipoProveedor } from "@/types"; // Cambiado a Proveedor
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter // No es necesario renombrar DialogFooter
} from "@/components/ui/dialog";

export default function ProveedorDetallePage() { // Nombre cambiado
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const proveedorId = params.id; // Nombre cambiado

  const [proveedor, setProveedor] = useState<IProveedor | null>(null); // Tipo y nombre cambiado
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchProveedor = async () => { // Nombre cambiado
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient<IProveedor>(`/api/proveedores/${proveedorId}`); // Endpoint y tipo cambiado
        setProveedor(data);
      } catch (err: unknown) {
        console.error("Error fetching proveedor:", err); // Mensaje cambiado
        const errorMessage = err instanceof Error ? err.message : "Error al cargar los datos del proveedor"; // Mensaje cambiado
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (proveedorId) {
      fetchProveedor();
    }
  }, [proveedorId]);

  const handleDelete = async () => {
    if (!proveedor) return;
    try {
      setIsDeleting(true);
      await apiClient(`/api/proveedores/${proveedor.id}`, { method: "DELETE" }); // Endpoint cambiado
      toast.success("Proveedor eliminado correctamente"); // Mensaje cambiado
      setShowDeleteDialog(false);
      setTimeout(() => {
        router.push("/proveedores"); // Ruta cambiada
      }, 1500);
    } catch (err: unknown) {
      console.error("Error deleting proveedor:", err); // Mensaje cambiado
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar el proveedor"; // Mensaje cambiado
      toast.error(errorMessage);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  // Iconos y clases para TipoProveedor
  const getTipoIcon = (tipo: TipoProveedor) => {
    switch (tipo) {
      case TipoProveedor.BIENES: return <Building className="h-5 w-5 text-blue-600" />;
      case TipoProveedor.SERVICIOS: return <Briefcase className="h-5 w-5 text-green-600" />;
      case TipoProveedor.MIXTO: return <UserRound className="h-5 w-5 text-purple-600" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTipoClass = (tipo: TipoProveedor) => {
    switch (tipo) {
      case TipoProveedor.BIENES: return "bg-blue-100 text-blue-800";
      case TipoProveedor.SERVICIOS: return "bg-green-100 text-green-800";
      case TipoProveedor.MIXTO: return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center"><div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" /><p className="mt-2">Cargando datos del proveedor...</p>
      </div></div>
    );
  }

  if (error && !proveedor) {
    return (
      <div className="py-10"><div className="p-4 mb-4 text-red-800 rounded-lg bg-red-50">
        <p>{error}</p>
        <Button onClick={() => router.push("/proveedores")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Proveedores
        </Button>
      </div></div>
    );
  }

  return (
    <div className="py-10"> {/* Contenedor principal como en Clientes */}
      <div className="container mx-auto px-4 md:px-6"> {/* Contenedor interno para el contenido principal */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => router.push("/proveedores")} className="mr-3">
              <ArrowLeft className="h-4 w-4 mr-1" />Volver
            </Button>
            <h1 className="text-3xl font-bold">Detalle del Proveedor</h1> {/* Título cambiado */}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/proveedores/editar/${proveedorId}`}> {/* Ruta cambiada */}
                <Edit className="mr-2 h-4 w-4" />Editar
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash className="mr-2 h-4 w-4" />Eliminar
            </Button>
          </div>
        </div>

        {proveedor && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columna Principal de Información */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getTipoIcon(proveedor.tipo)}
                  <div>
                    <CardTitle className="text-2xl">{proveedor.nombre}</CardTitle>
                    <CardDescription className="mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getTipoClass(proveedor.tipo)}`}>
                        {proveedor.tipo}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Información de contacto</h3>
                      <Separator className="my-2" />
                      {proveedor.persona_de_contacto && (
                        <div className="flex items-center mt-3">
                          <UserRound className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Contacto: {proveedor.persona_de_contacto}</span>
                        </div>
                      )}
                      {proveedor.email && (
                        <div className="flex items-center mt-3">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Email: <a href={`mailto:${proveedor.email}`} className="text-blue-600 hover:underline">{proveedor.email}</a></span>
                        </div>
                      )}
                      {proveedor.telefono && (
                        <div className="flex items-center mt-3">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Teléfono: <a href={`tel:${proveedor.telefono}`} className="text-blue-600 hover:underline">{proveedor.telefono}</a></span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Información fiscal y dirección</h3>
                      <Separator className="my-2" />
                      {proveedor.nif && (
                        <div className="flex items-center mt-3">
                          <FileEdit className="h-4 w-4 mr-2 text-gray-400" />
                          <span>NIF/CIF: {proveedor.nif}</span>
                        </div>
                      )}
                      {proveedor.es_intracomunitario !== undefined && (
                        <div className="flex items-center mt-3">
                          <Info className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Intracomunitario: {proveedor.es_intracomunitario ? 'Sí' : 'No'}</span>
                        </div>
                      )}
                      {proveedor.direccion && (
                        <div className="flex items-start mt-3">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                          <div>
                            <p>{proveedor.direccion}</p>
                            {proveedor.ciudad && <p>{proveedor.ciudad}</p>}
                            {/* Podría añadirse código postal y provincia si existen en el modelo */}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t p-6">
                <div className="flex items-center mt-4 text-sm text-gray-500"> {/* Quitado mt-4 de cliente */}
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Creado: {formatDate(proveedor.created_at)}</span>
                </div>
                <div className="flex items-center mt-4 text-sm text-gray-500"> {/* Quitado mt-4 de cliente */}
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Actualizado: {formatDate(proveedor.updated_at)}</span>
                </div>
              </CardFooter>
            </Card>

            {/* Columna Lateral */}
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
                <CardDescription>
                  Detalles relevantes del proveedor.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p className="text-sm text-gray-500">No hay acciones directas disponibles para proveedores en esta sección.</p>
                 {proveedor.id && (
                    <div className="text-sm text-gray-500 pt-4 border-t mt-4">
                        <h4 className="font-medium text-gray-700 mb-1">ID del Proveedor:</h4>
                        <span className='font-mono text-xs bg-gray-100 p-1 rounded'>{proveedor.id}</span>
                    </div>
                 )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* El componente Dialog envuelve todo el contenido del modal */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar proveedor?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor
              <span className="font-medium"> {proveedor?.nombre}</span> y todos sus datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</>
              ) : (
                <><Trash className="mr-2 h-4 w-4" /> Eliminar</>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 