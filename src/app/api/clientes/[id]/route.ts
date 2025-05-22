import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ClienteSchema } from '@/lib/schemas';
import { ICliente } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clientes/[id] - Obtener un cliente específico
export async function GET(request: Request, { params }: RouteParams) {
  // Esperamos que se resuelva la promesa params
  const resolvedParams = await params;
  const clienteId = resolvedParams.id;
  
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // La API de cookies puede fallar en modo API route
            console.error("Error al establecer cookie:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch (error) {
            // La API de cookies puede fallar en modo API route
            console.error("Error al eliminar cookie:", error);
          }
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }

  if (!clienteId) {
    return NextResponse.json({ error: 'ID de cliente no proporcionado' }, { status: 400 });
  }

  try {
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .eq('user_id', user.id) // Asegurar que el cliente pertenece al usuario
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Cliente no encontrado o no pertenece al usuario' }, { status: 404 });
      }
      console.error(`Error al obtener cliente ${clienteId}:`, error);
      return NextResponse.json({ error: 'Error al obtener cliente', details: error.message }, { status: 500 });
    }

    if (!cliente) {
        return NextResponse.json({ error: 'Cliente no encontrado o no pertenece al usuario' }, { status: 404 });
    }

    return NextResponse.json(cliente as ICliente);
  } catch (e: unknown) {
    const clienteId = (await params).id;
    console.error(`Excepción en GET /api/clientes/${clienteId}:`, e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
}

// PUT /api/clientes/[id] - Actualizar un cliente específico
export async function PUT(request: Request, { params }: RouteParams) {
  // Esperamos que se resuelva la promesa params
  const resolvedParams = await params;
  const clienteId = resolvedParams.id;
  
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // La API de cookies puede fallar en modo API route
            console.error("Error al establecer cookie:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch (error) {
            // La API de cookies puede fallar en modo API route
            console.error("Error al eliminar cookie:", error);
          }
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }

  if (!clienteId) {
    return NextResponse.json({ error: 'ID de cliente no proporcionado' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = ClienteSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos de cliente inválidos', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    // Los datos validados para la actualización
    const updateData = validation.data;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
    }

    // Verificar que el cliente exista y pertenezca al usuario antes de actualizar
    const { data: existingCliente, error: fetchError } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', clienteId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingCliente) {
      return NextResponse.json({ error: 'Cliente no encontrado o no pertenece al usuario para actualizar' }, { status: 404 });
    }
    
    const { data, error } = await supabase
      .from('clientes')
      .update(updateData) // Se usa directamente validation.data que no incluye user_id
      .eq('id', clienteId)
      .eq('user_id', user.id) // Doble check de seguridad
      .select()
      .single();

    if (error) {
      console.error(`Error al actualizar cliente ${clienteId}:`, error);
      if (error.code === '23505') { 
         return NextResponse.json({ error: 'Error al actualizar cliente: posible duplicado (ej. NIF)', details: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error al actualizar cliente', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data as ICliente);
  } catch (e: unknown) {
    const clienteId = (await params).id;
    console.error(`Excepción en PUT /api/clientes/${clienteId}:`, e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
}

// DELETE /api/clientes/[id] - Eliminar un cliente específico
export async function DELETE(request: Request, { params }: RouteParams) {
  // Esperamos que se resuelva la promesa params
  const resolvedParams = await params;
  const clienteId = resolvedParams.id;
  
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // La API de cookies puede fallar en modo API route
            console.error("Error al establecer cookie:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch (error) {
            // La API de cookies puede fallar en modo API route
            console.error("Error al eliminar cookie:", error);
          }
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }

  if (!clienteId) {
    return NextResponse.json({ error: 'ID de cliente no proporcionado' }, { status: 400 });
  }

  try {
    const { error: deleteError } = await supabase
      .from('clientes')
      .delete()
      .eq('id', clienteId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error(`Error al eliminar cliente ${clienteId}:`, deleteError);
      return NextResponse.json({ error: 'Error al eliminar cliente', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Cliente eliminado correctamente' }, { status: 200 });
  } catch (e: unknown) {
    const clienteId = (await params).id;
    console.error(`Excepción en DELETE /api/clientes/${clienteId}:`, e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
} 