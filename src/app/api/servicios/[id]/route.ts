import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { servicioIdSchema, updateServicioSchema } from '@/lib/schemas/servicio';
import type { UpdateServicioData, Servicio } from '@/types/servicio';

/**
 * GET /api/servicios/[id]
 * Obtiene un servicio específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Validar ID
    const idValidation = servicioIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'ID de servicio inválido' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener el servicio
    const { data: servicio, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Servicio no encontrado' },
          { status: 404 }
        );
      }
      console.error('Error al obtener servicio:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ servicio: servicio as Servicio });

  } catch (error) {
    console.error('Error en GET /api/servicios/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/servicios/[id]
 * Actualiza un servicio específico
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Validar ID
    const idValidation = servicioIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'ID de servicio inválido' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Validar datos de entrada con más debugging
    const body = await request.json();
    console.log('Datos recibidos para validación:', body);
    console.log('Tipo de body:', typeof body);
    console.log('Es array?', Array.isArray(body));
    console.log('Constructor:', body.constructor.name);
    
    // Intentar parsear una vez más si es string
    let parsedBody = body;
    if (typeof body === 'string') {
      try {
        parsedBody = JSON.parse(body);
        console.log('Body parseado desde string:', parsedBody);
      } catch (parseError) {
        console.error('Error parseando JSON:', parseError);
        return NextResponse.json(
          { error: 'JSON inválido' },
          { status: 400 }
        );
      }
    }
    
    const validationResult = updateServicioSchema.safeParse(parsedBody);

    if (!validationResult.success) {
      console.error('Errores de validación:', validationResult.error.errors);
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors,
          received: parsedBody
        },
        { status: 400 }
      );
    }

    const updateData: UpdateServicioData = validationResult.data;

    // Si se está actualizando el nombre, verificar que no exista otro servicio con ese nombre
    if (updateData.nombre) {
      const { data: existingServicio } = await supabase
        .from('servicios')
        .select('id')
        .eq('user_id', user.id)
        .eq('nombre', updateData.nombre)
        .neq('id', id)
        .single();

      if (existingServicio) {
        return NextResponse.json(
          { error: 'Ya existe un servicio con este nombre' },
          { status: 409 }
        );
      }
    }

    // Actualizar el servicio
    const { data: servicioActualizado, error } = await supabase
      .from('servicios')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Servicio no encontrado' },
          { status: 404 }
        );
      }
      console.error('Error al actualizar servicio:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el servicio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      servicio: servicioActualizado as Servicio,
      message: 'Servicio actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error en PUT /api/servicios/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/servicios/[id]
 * Elimina un servicio específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Validar ID
    const idValidation = servicioIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'ID de servicio inválido' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // TODO: En el futuro, verificar si el servicio está siendo usado en presupuestos
    // const { count } = await supabase
    //   .from('presupuesto_servicios')
    //   .select('*', { count: 'exact', head: true })
    //   .eq('servicio_id', id);
    // 
    // if (count && count > 0) {
    //   return NextResponse.json(
    //     { error: 'No se puede eliminar el servicio porque está siendo usado en presupuestos' },
    //     { status: 409 }
    //   );
    // }

    // Eliminar el servicio
    const { error } = await supabase
      .from('servicios')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error al eliminar servicio:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el servicio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Servicio eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /api/servicios/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 