import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { updatePersonalSchema, personalIdSchema } from '@/lib/schemas/personal';
import { IPersonal } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/personal/[id] - Obtener un personal específico
export async function GET(request: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const personalId = resolvedParams.id;
  
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

  // Validar ID
  const idValidation = personalIdSchema.safeParse(personalId);
  if (!idValidation.success) {
    return NextResponse.json({ error: 'ID de personal no válido' }, { status: 400 });
  }

  try {
    const { data: personal, error } = await supabase
      .from('personal')
      .select('*')
      .eq('id', personalId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Personal no encontrado o no pertenece al usuario' }, { status: 404 });
      }
      console.error(`Error al obtener personal ${personalId}:`, error);
      return NextResponse.json({ error: 'Error al obtener personal', details: error.message }, { status: 500 });
    }

    if (!personal) {
      return NextResponse.json({ error: 'Personal no encontrado o no pertenece al usuario' }, { status: 404 });
    }

    return NextResponse.json(personal as IPersonal);
  } catch (e: unknown) {
    console.error(`Excepción en GET /api/personal/${personalId}:`, e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
}

// PUT /api/personal/[id] - Actualizar un personal específico
export async function PUT(request: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const personalId = resolvedParams.id;
  
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

  // Validar ID
  const idValidation = personalIdSchema.safeParse(personalId);
  if (!idValidation.success) {
    return NextResponse.json({ error: 'ID de personal no válido' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = updatePersonalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Datos de personal inválidos', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const updateData = validation.data;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
    }

    // Verificar que el personal exista y pertenezca al usuario
    const { data: existingPersonal, error: fetchError } = await supabase
      .from('personal')
      .select('id')
      .eq('id', personalId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingPersonal) {
      return NextResponse.json({ error: 'Personal no encontrado o no pertenece al usuario' }, { status: 404 });
    }
    
    const { data, error } = await supabase
      .from('personal')
      .update(updateData)
      .eq('id', personalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error(`Error al actualizar personal ${personalId}:`, error);
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'Error al actualizar personal: posible duplicado', 
          details: error.message 
        }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error al actualizar personal', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data as IPersonal);
  } catch (e: unknown) {
    console.error(`Excepción en PUT /api/personal/${personalId}:`, e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
}

// DELETE /api/personal/[id] - Eliminar un personal específico
export async function DELETE(request: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const personalId = resolvedParams.id;
  
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

  // Validar ID
  const idValidation = personalIdSchema.safeParse(personalId);
  if (!idValidation.success) {
    return NextResponse.json({ error: 'ID de personal no válido' }, { status: 400 });
  }

  try {
    // Verificar que el personal exista y pertenezca al usuario
    const { data: existingPersonal, error: fetchError } = await supabase
      .from('personal')
      .select('id, nombre')
      .eq('id', personalId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingPersonal) {
      return NextResponse.json({ error: 'Personal no encontrado o no pertenece al usuario' }, { status: 404 });
    }

    // Eliminar el personal (las asignaciones de puestos se eliminan automáticamente por CASCADE)
    const { error } = await supabase
      .from('personal')
      .delete()
      .eq('id', personalId)
      .eq('user_id', user.id);

    if (error) {
      console.error(`Error al eliminar personal ${personalId}:`, error);
      return NextResponse.json({ error: 'Error al eliminar personal', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Personal eliminado correctamente',
      id: personalId 
    });
  } catch (e: unknown) {
    console.error(`Excepción en DELETE /api/personal/${personalId}:`, e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
} 