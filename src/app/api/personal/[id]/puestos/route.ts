import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { personalIdSchema, asignarPuestosTrabajoSchema, reemplazarPuestosTrabajoSchema } from '@/lib/schemas/personal';
import { IPersonalConPuestos, IPersonalPuestoTrabajo } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/personal/[id]/puestos - Obtener un personal con sus puestos asignados
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
    // Obtener el personal y sus puestos asignados
    const { data: personal, error: personalError } = await supabase
      .from('personal')
      .select(`
        *,
        personal_puestos_trabajo (
          id,
          puesto_trabajo_id,
          fecha_asignacion,
          tarifa_por_dia,
          puestos_trabajo (
            nombre
          )
        )
      `)
      .eq('id', personalId)
      .eq('user_id', user.id)
      .single();

    if (personalError) {
      if (personalError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Personal no encontrado o no pertenece al usuario' }, { status: 404 });
      }
      console.error(`Error al obtener personal con puestos ${personalId}:`, personalError);
      return NextResponse.json({ error: 'Error al obtener personal', details: personalError.message }, { status: 500 });
    }

    if (!personal) {
      return NextResponse.json({ error: 'Personal no encontrado o no pertenece al usuario' }, { status: 404 });
    }

    // Transformar los datos al formato esperado
    const personalConPuestos: IPersonalConPuestos = {
      ...personal,
      puestos_trabajo: personal.personal_puestos_trabajo?.map((asignacion: any) => ({
        id: asignacion.id,
        puesto_trabajo_id: asignacion.puesto_trabajo_id,
        nombre_puesto: asignacion.puestos_trabajo?.nombre || 'Puesto no encontrado',
        tarifa_por_dia: asignacion.tarifa_por_dia,
        fecha_asignacion: asignacion.fecha_asignacion,
      })) || []
    };

    // Eliminar la propiedad temporal
    delete (personalConPuestos as any).personal_puestos_trabajo;

    return NextResponse.json(personalConPuestos);
  } catch (e: unknown) {
    console.error(`Excepción en GET /api/personal/${personalId}/puestos:`, e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
}

// POST /api/personal/[id]/puestos - Asignar puestos de trabajo a un personal
export async function POST(request: Request, { params }: RouteParams) {
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

  // Validar ID del personal
  const idValidation = personalIdSchema.safeParse(personalId);
  if (!idValidation.success) {
    return NextResponse.json({ error: 'ID de personal no válido' }, { status: 400 });
  }

  try {
    // Fix para request.json() que a veces devuelve string
    const rawBody = await request.json();
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    
    const validation = asignarPuestosTrabajoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Datos de asignación inválidos', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    // Verificar que el personal exista y pertenezca al usuario
    const { data: existingPersonal, error: personalError } = await supabase
      .from('personal')
      .select('id')
      .eq('id', personalId)
      .eq('user_id', user.id)
      .single();

    if (personalError || !existingPersonal) {
      return NextResponse.json({ error: 'Personal no encontrado o no pertenece al usuario' }, { status: 404 });
    }

    // Verificar que todos los puestos de trabajo existan y pertenezcan al usuario
    const puestosIds = validation.data.puestos_trabajo.map(p => p.puesto_trabajo_id);
    const { data: puestosExistentes, error: puestosError } = await supabase
      .from('puestos_trabajo')
      .select('id')
      .eq('user_id', user.id)
      .in('id', puestosIds);

    if (puestosError || !puestosExistentes || puestosExistentes.length !== puestosIds.length) {
      return NextResponse.json({ 
        error: 'Uno o más puestos de trabajo no existen o no pertenecen al usuario' 
      }, { status: 400 });
    }

    // Preparar los datos para insertar
    const asignacionesData = validation.data.puestos_trabajo.map(puesto => ({
      personal_id: personalId,
      puesto_trabajo_id: puesto.puesto_trabajo_id,
      fecha_asignacion: puesto.fecha_asignacion || new Date().toISOString().split('T')[0],
      tarifa_por_dia: puesto.tarifa_por_dia,
    }));

    // Insertar las asignaciones (el constraint UNIQUE evitará duplicados)
    const { data, error } = await supabase
      .from('personal_puestos_trabajo')
      .insert(asignacionesData)
      .select();

    if (error) {
      console.error(`Error al asignar puestos al personal ${personalId}:`, error);
      if (error.code === '23505') { // Violación de unicidad
        return NextResponse.json({ 
          error: 'El personal ya tiene asignado uno o más de estos puestos de trabajo', 
          details: error.message 
        }, { status: 409 });
      }
      return NextResponse.json({ 
        error: 'Error al asignar puestos de trabajo', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json(data as IPersonalPuestoTrabajo[], { status: 201 });
  } catch (e: unknown) {
    console.error(`Excepción en POST /api/personal/${personalId}/puestos:`, e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
}

// PUT /api/personal/[id]/puestos - Reemplazar todos los puestos de trabajo de un personal
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

  // Validar ID del personal
  const idValidation = personalIdSchema.safeParse(personalId);
  if (!idValidation.success) {
    return NextResponse.json({ error: 'ID de personal no válido' }, { status: 400 });
  }

  try {
    // Fix para request.json() que a veces devuelve string
    const rawBody = await request.json();
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    
    const validation = reemplazarPuestosTrabajoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Datos de asignación inválidos', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    // Verificar que el personal exista y pertenezca al usuario
    const { data: existingPersonal, error: personalError } = await supabase
      .from('personal')
      .select('id')
      .eq('id', personalId)
      .eq('user_id', user.id)
      .single();

    if (personalError || !existingPersonal) {
      return NextResponse.json({ error: 'Personal no encontrado o no pertenece al usuario' }, { status: 404 });
    }

    // Verificar que todos los puestos de trabajo existan y pertenezcan al usuario (si hay puestos)
    if (validation.data.puestos_trabajo.length > 0) {
      const puestosIds = validation.data.puestos_trabajo.map(p => p.puesto_trabajo_id);
      const { data: puestosExistentes, error: puestosError } = await supabase
        .from('puestos_trabajo')
        .select('id')
        .eq('user_id', user.id)
        .in('id', puestosIds);

      if (puestosError || !puestosExistentes || puestosExistentes.length !== puestosIds.length) {
        return NextResponse.json({ 
          error: 'Uno o más puestos de trabajo no existen o no pertenecen al usuario' 
        }, { status: 400 });
      }
    }

    // Usar una transacción para eliminar y luego insertar
    // Primero eliminar todos los puestos existentes de este personal
    const { error: deleteError } = await supabase
      .from('personal_puestos_trabajo')
      .delete()
      .eq('personal_id', personalId);

    if (deleteError) {
      console.error(`Error al eliminar puestos existentes del personal ${personalId}:`, deleteError);
      return NextResponse.json({ 
        error: 'Error al eliminar puestos existentes', 
        details: deleteError.message 
      }, { status: 500 });
    }

    // Si hay nuevos puestos que asignar, los insertamos
    if (validation.data.puestos_trabajo.length > 0) {
      const asignacionesData = validation.data.puestos_trabajo.map(puesto => ({
        personal_id: personalId,
        puesto_trabajo_id: puesto.puesto_trabajo_id,
        fecha_asignacion: puesto.fecha_asignacion || new Date().toISOString().split('T')[0],
        tarifa_por_dia: puesto.tarifa_por_dia,
      }));

      const { data: insertData, error: insertError } = await supabase
        .from('personal_puestos_trabajo')
        .insert(asignacionesData)
        .select();

      if (insertError) {
        console.error(`Error al insertar nuevos puestos para el personal ${personalId}:`, insertError);
        return NextResponse.json({ 
          error: 'Error al asignar nuevos puestos de trabajo', 
          details: insertError.message 
        }, { status: 500 });
      }

      return NextResponse.json(insertData as IPersonalPuestoTrabajo[], { status: 200 });
    } else {
      // No hay puestos nuevos, solo se eliminaron los existentes
      return NextResponse.json({ message: 'Todos los puestos han sido eliminados del personal' }, { status: 200 });
    }

  } catch (e: unknown) {
    console.error(`Excepción en PUT /api/personal/${personalId}/puestos:`, e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
} 