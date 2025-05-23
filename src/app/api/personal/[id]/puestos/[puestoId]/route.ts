import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { personalIdSchema, personalPuestoTrabajoSchema } from '@/lib/schemas/personal';
import { IPersonalPuestoTrabajo } from '@/types';

interface RouteParams {
  params: Promise<{ id: string; puestoId: string }>;
}

// PUT /api/personal/[id]/puestos/[puestoId] - Actualizar una asignación específica
export async function PUT(request: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const { id: personalId, puestoId } = resolvedParams;
  
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
            console.error("Error al establecer cookie:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch (error) {
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

  // Validar IDs
  const personalIdValidation = personalIdSchema.safeParse(personalId);
  const puestoIdValidation = personalIdSchema.safeParse(puestoId); // Usar el mismo schema UUID

  if (!personalIdValidation.success || !puestoIdValidation.success) {
    return NextResponse.json({ error: 'ID de personal o puesto de trabajo no válido' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = personalPuestoTrabajoSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Datos de asignación inválidos', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const updateData = validation.data;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
    }

    // Verificar que la asignación exista y pertenezca al usuario
    const { data: existingAsignacion, error: fetchError } = await supabase
      .from('personal_puestos_trabajo')
      .select(`
        id,
        personal!inner(user_id)
      `)
      .eq('id', puestoId)
      .eq('personal_id', personalId)
      .single();

    if (fetchError || !existingAsignacion || (existingAsignacion.personal as any).user_id !== user.id) {
      return NextResponse.json({ 
        error: 'Asignación no encontrada o no pertenece al usuario' 
      }, { status: 404 });
    }

    // Actualizar la asignación
    const { data, error } = await supabase
      .from('personal_puestos_trabajo')
      .update(updateData)
      .eq('id', puestoId)
      .eq('personal_id', personalId)
      .select()
      .single();

    if (error) {
      console.error(`Error al actualizar asignación ${puestoId}:`, error);
      return NextResponse.json({ 
        error: 'Error al actualizar asignación', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json(data as IPersonalPuestoTrabajo);
  } catch (e: unknown) {
    console.error(`Excepción en PUT /api/personal/${personalId}/puestos/${puestoId}:`, e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
}

// DELETE /api/personal/[id]/puestos/[puestoId] - Eliminar una asignación específica
export async function DELETE(request: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const { id: personalId, puestoId } = resolvedParams;
  
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
            console.error("Error al establecer cookie:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch (error) {
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

  // Validar IDs
  const personalIdValidation = personalIdSchema.safeParse(personalId);
  const puestoIdValidation = personalIdSchema.safeParse(puestoId);

  if (!personalIdValidation.success || !puestoIdValidation.success) {
    return NextResponse.json({ error: 'ID de personal o puesto de trabajo no válido' }, { status: 400 });
  }

  try {
    // Verificar que la asignación exista y pertenezca al usuario
    const { data: existingAsignacion, error: fetchError } = await supabase
      .from('personal_puestos_trabajo')
      .select(`
        id,
        personal!inner(user_id, nombre),
        puestos_trabajo!inner(nombre)
      `)
      .eq('id', puestoId)
      .eq('personal_id', personalId)
      .single();

    if (fetchError || !existingAsignacion || (existingAsignacion.personal as any).user_id !== user.id) {
      return NextResponse.json({ 
        error: 'Asignación no encontrada o no pertenece al usuario' 
      }, { status: 404 });
    }

    // Eliminar la asignación
    const { error } = await supabase
      .from('personal_puestos_trabajo')
      .delete()
      .eq('id', puestoId)
      .eq('personal_id', personalId);

    if (error) {
      console.error(`Error al eliminar asignación ${puestoId}:`, error);
      return NextResponse.json({ 
        error: 'Error al eliminar asignación', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Asignación eliminada correctamente',
      id: puestoId,
      personalNombre: (existingAsignacion.personal as any).nombre,
      puestoNombre: (existingAsignacion.puestos_trabajo as any).nombre
    });
  } catch (e: unknown) {
    console.error(`Excepción en DELETE /api/personal/${personalId}/puestos/${puestoId}:`, e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
} 