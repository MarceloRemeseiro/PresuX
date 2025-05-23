import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createPuestoTrabajoSchema } from '@/lib/schemas/puesto-trabajo';
import type { CreatePuestoTrabajoData, PuestoTrabajo } from '@/types/puesto-trabajo';

/**
 * GET /api/puestos-trabajo
 * Lista todos los puestos de trabajo del usuario autenticado
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener puestos de trabajo del usuario
    const { data: puestosTrabajo, error } = await supabase
      .from('puestos_trabajo')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener puestos de trabajo:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ puestosTrabajo: puestosTrabajo as PuestoTrabajo[] });

  } catch (error) {
    console.error('Error en GET /api/puestos-trabajo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/puestos-trabajo
 * Crea un nuevo puesto de trabajo
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Validar datos de entrada
    // Fix para request.json() que a veces devuelve string
    const rawBody = await request.json();
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    
    const validationResult = createPuestoTrabajoSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const puestoTrabajoData: CreatePuestoTrabajoData = validationResult.data;

    // Verificar que no exista un puesto con el mismo nombre para este usuario
    const { data: existingPuesto } = await supabase
      .from('puestos_trabajo')
      .select('id')
      .eq('user_id', user.id)
      .eq('nombre', puestoTrabajoData.nombre)
      .single();

    if (existingPuesto) {
      return NextResponse.json(
        { error: 'Ya existe un puesto de trabajo con este nombre' },
        { status: 409 }
      );
    }

    // Crear el puesto de trabajo
    const { data: nuevoPuesto, error } = await supabase
      .from('puestos_trabajo')
      .insert({
        user_id: user.id,
        ...puestoTrabajoData
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear puesto de trabajo:', error);
      return NextResponse.json(
        { error: 'Error al crear el puesto de trabajo' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        puestoTrabajo: nuevoPuesto as PuestoTrabajo,
        message: 'Puesto de trabajo creado exitosamente'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error en POST /api/puestos-trabajo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 