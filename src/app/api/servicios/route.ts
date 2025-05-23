import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServicioSchema } from '@/lib/schemas/servicio';
import type { CreateServicioData, Servicio } from '@/types/servicio';

/**
 * GET /api/servicios
 * Lista todos los servicios del usuario autenticado
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

    // Obtener servicios del usuario
    const { data: servicios, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener servicios:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ servicios: servicios as Servicio[] });

  } catch (error) {
    console.error('Error en GET /api/servicios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/servicios
 * Crea un nuevo servicio
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
    const body = await request.json();
    const validationResult = createServicioSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const servicioData: CreateServicioData = validationResult.data;

    // Verificar que no exista un servicio con el mismo nombre para este usuario
    const { data: existingServicio } = await supabase
      .from('servicios')
      .select('id')
      .eq('user_id', user.id)
      .eq('nombre', servicioData.nombre)
      .single();

    if (existingServicio) {
      return NextResponse.json(
        { error: 'Ya existe un servicio con este nombre' },
        { status: 409 }
      );
    }

    // Crear el servicio
    const { data: nuevoServicio, error } = await supabase
      .from('servicios')
      .insert({
        user_id: user.id,
        ...servicioData
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear servicio:', error);
      return NextResponse.json(
        { error: 'Error al crear el servicio' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        servicio: nuevoServicio as Servicio,
        message: 'Servicio creado exitosamente'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error en POST /api/servicios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 