import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { puestoTrabajoIdSchema, updatePuestoTrabajoSchema } from '@/lib/schemas/puesto-trabajo';
import type { UpdatePuestoTrabajoData, PuestoTrabajo } from '@/types/puesto-trabajo';

/**
 * GET /api/puestos-trabajo/[id]
 * Obtiene un puesto de trabajo específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Validar ID
    const idValidation = puestoTrabajoIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'ID de puesto de trabajo inválido' },
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

    // Obtener el puesto de trabajo
    const { data: puestoTrabajo, error } = await supabase
      .from('puestos_trabajo')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Puesto de trabajo no encontrado' },
          { status: 404 }
        );
      }
      console.error('Error al obtener puesto de trabajo:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ puestoTrabajo: puestoTrabajo as PuestoTrabajo });

  } catch (error) {
    console.error('Error en GET /api/puestos-trabajo/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/puestos-trabajo/[id]
 * Actualiza un puesto de trabajo específico
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Validar ID
    const idValidation = puestoTrabajoIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'ID de puesto de trabajo inválido' },
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
    console.log('Datos recibidos para validación (puestos):', body);
    console.log('Tipo de body (puestos):', typeof body);
    console.log('Es array? (puestos)', Array.isArray(body));
    console.log('Constructor (puestos):', body.constructor.name);
    
    // Intentar parsear una vez más si es string
    let parsedBody = body;
    if (typeof body === 'string') {
      try {
        parsedBody = JSON.parse(body);
        console.log('Body parseado desde string (puestos):', parsedBody);
      } catch (parseError) {
        console.error('Error parseando JSON (puestos):', parseError);
        return NextResponse.json(
          { error: 'JSON inválido' },
          { status: 400 }
        );
      }
    }
    
    const validationResult = updatePuestoTrabajoSchema.safeParse(parsedBody);

    if (!validationResult.success) {
      console.error('Errores de validación (puestos):', validationResult.error.errors);
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors,
          received: parsedBody
        },
        { status: 400 }
      );
    }

    const updateData: UpdatePuestoTrabajoData = validationResult.data;

    // Si se está actualizando el nombre, verificar que no exista otro puesto con ese nombre
    if (updateData.nombre) {
      const { data: existingPuesto } = await supabase
        .from('puestos_trabajo')
        .select('id')
        .eq('user_id', user.id)
        .eq('nombre', updateData.nombre)
        .neq('id', id)
        .single();

      if (existingPuesto) {
        return NextResponse.json(
          { error: 'Ya existe un puesto de trabajo con este nombre' },
          { status: 409 }
        );
      }
    }

    // Actualizar el puesto de trabajo
    const { data: puestoActualizado, error } = await supabase
      .from('puestos_trabajo')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Puesto de trabajo no encontrado' },
          { status: 404 }
        );
      }
      console.error('Error al actualizar puesto de trabajo:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el puesto de trabajo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      puestoTrabajo: puestoActualizado as PuestoTrabajo,
      message: 'Puesto de trabajo actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error en PUT /api/puestos-trabajo/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/puestos-trabajo/[id]
 * Elimina un puesto de trabajo específico
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    
    // Validar ID
    const idValidation = puestoTrabajoIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'ID de puesto de trabajo inválido' },
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

    // TODO: En el futuro, verificar si el puesto está siendo usado en presupuestos
    // const { count } = await supabase
    //   .from('presupuesto_puestos')
    //   .select('*', { count: 'exact', head: true })
    //   .eq('puesto_trabajo_id', id);
    // 
    // if (count && count > 0) {
    //   return NextResponse.json(
    //     { error: 'No se puede eliminar el puesto porque está siendo usado en presupuestos' },
    //     { status: 409 }
    //   );
    // }

    // Eliminar el puesto de trabajo
    const { error } = await supabase
      .from('puestos_trabajo')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error al eliminar puesto de trabajo:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el puesto de trabajo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Puesto de trabajo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /api/puestos-trabajo/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 