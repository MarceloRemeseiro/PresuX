"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Loader2, 
  Edit, 
  Trash, 
  Building, 
  UserRound, 
  Briefcase,
  Mail,
  Phone,
  MapPin,
  FileEdit,
  Clock,
  Info
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/apiClient";
import { ICliente, TipoCliente } from "@/types";
import { 
  Dialog,
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

export default function ClienteDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const clienteId = params.id;

  const [cliente, setCliente] = useState<ICliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient<ICliente>(`/api/clientes/${clienteId}`);
        setCliente(data);
      } catch (err: any) {
        console.error("Error fetching cliente:", err);
        setError(err.message || "Error al cargar los datos del cliente");
        toast.error(err.message || "Error al cargar los datos del cliente");
      } finally {
        setIsLoading(false);
      }
    };

    if (clienteId) {
      fetchCliente();
    }
  }, [clienteId]);

  const handleDelete = async () => {
    if (!cliente) return;
    
    try {
      setIsDeleting(true);
      await apiClient(`/api/clientes/${cliente.id}`, { method: "DELETE" });
      
      toast.success("Cliente eliminado correctamente");
      setShowDeleteDialog(false);
      
      // Redirigir después de un pequeño retraso para que se vea el toast
      setTimeout(() => {
        router.push("/clientes");
      }, 1500);
    } catch (err: any) {
      console.error("Error deleting cliente:", err);
      toast.error(err.message || "Error al eliminar el cliente");
      setIsDeleting(false);
    }
  };

  // Función para formatear fechas ISO a formato legible
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Renderizar icono según el tipo de cliente
  const getTipoIcon = (tipo: TipoCliente) => {
    switch (tipo) {
      case TipoCliente.EMPRESA:
        return <Building className="h-5 w-5 text-blue-600" />;
      case TipoCliente.AUTONOMO:
        return <Briefcase className="h-5 w-5 text-yellow-600" />;
      case TipoCliente.PARTICULAR:
        return <UserRound className="h-5 w-5 text-green-600" />;
      default:
        return null;
    }
  };

  const getTipoClass = (tipo: TipoCliente) => {
    switch (tipo) {
      case TipoCliente.EMPRESA:
        return "bg-blue-100 text-blue-800";
      case TipoCliente.AUTONOMO:
        return "bg-yellow-100 text-yellow-800";
      case TipoCliente.PARTICULAR:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 flex justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Cargando datos del cliente...</p>
        </div>
      </div>
    )
  }

  if (error && !cliente) {
    return (
      <div className="py-10">
        <div className="p-4 mb-4 text-red-800 rounded-lg bg-red-50">
          <p>{error}</p>
          <Button onClick={() => router.push("/clientes")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Clientes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/clientes")}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Detalle del Cliente</h1>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clientes/editar/${clienteId}`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {cliente && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                {getTipoIcon(cliente.tipo)}
                <div>
                  <CardTitle className="text-2xl">{cliente.nombre}</CardTitle>
                  <CardDescription>
                    <span 
                      className={`px-2 py-0.5 rounded-full text-xs ${getTipoClass(cliente.tipo)}`}
                    >
                      {cliente.tipo}
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
                    
                    {cliente.persona_de_contacto && (
                      <div className="flex items-center mt-3">
                        <UserRound className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Contacto: {cliente.persona_de_contacto}</span>
                      </div>
                    )}
                    
                    {cliente.email && (
                      <div className="flex items-center mt-3">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Email: <a href={`mailto:${cliente.email}`} className="text-blue-600 hover:underline">{cliente.email}</a></span>
                      </div>
                    )}
                    
                    {cliente.telefono && (
                      <div className="flex items-center mt-3">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Teléfono: <a href={`tel:${cliente.telefono}`} className="text-blue-600 hover:underline">{cliente.telefono}</a></span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Información fiscal y dirección</h3>
                    <Separator className="my-2" />
                    
                    {cliente.nif && (
                      <div className="flex items-center mt-3">
                        <FileEdit className="h-4 w-4 mr-2 text-gray-400" />
                        <span>NIF/CIF: {cliente.nif}</span>
                      </div>
                    )}
                    
                    {cliente.es_intracomunitario !== undefined && (
                      <div className="flex items-center mt-3">
                        <Info className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Intracomunitario: {cliente.es_intracomunitario ? 'Sí' : 'No'}</span>
                      </div>
                    )}
                    
                    {cliente.direccion && (
                      <div className="flex items-start mt-3">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                        <div>
                          <p>{cliente.direccion}</p>
                          {cliente.ciudad && <p>{cliente.ciudad}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t p-6">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>Creado: {formatDate(cliente.created_at)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>Actualizado: {formatDate(cliente.updated_at)}</span>
              </div>
            </CardFooter>
          </Card>

          {/* Panel lateral con acciones y datos relacionados */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones y Documentos</CardTitle>
              <CardDescription>
                Gestiona los documentos del cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full">
                Crear Presupuesto
              </Button>
              <Button className="w-full">
                Crear Factura
              </Button>
              <Separator />
              <div className="text-sm text-gray-500">
                <p className="font-medium mb-1">Próximamente</p>
                <p>• Ver historial de documentos</p>
                <p>• Estadísticas del cliente</p>
                <p>• Seguimiento de pagos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente
              <span className="font-medium"> {cliente?.nombre}</span> y todos sus datos.
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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Eliminar
                </>
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

      <Toaster />
    </div>
  );
} 