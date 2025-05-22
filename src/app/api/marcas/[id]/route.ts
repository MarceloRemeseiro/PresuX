import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { z } from 'zod';
import { marcaIdSchema, updateMarcaSchema } from '@/lib/schemas/marca';

// Helper para obtener el ID validado de los params
async function getValidatedId(params: unknown): Promise<string | null> {
  const paramsValidation = z.object({ id: marcaIdSchema }).safeParse(params);
  if (!paramsValidation.success) {
    return null;
  }
  return paramsValidation.data.id;
}

// GET: Obtener una marca específica
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const marcaId = await getValidatedId(params);
    if (!marcaId) {
      return NextResponse.json({ error: 'ID de marca inválido' }, { status: 400 });
    }

    const { data: marca, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('id', marcaId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 });
      }
      console.error('Error fetching marca:', error);
      return NextResponse.json({ error: 'Error al obtener la marca: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(marca);

  } catch (e) {
    console.error('Error inesperado en GET /api/marcas/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Actualizar una marca específica
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const marcaId = await getValidatedId(params);
    if (!marcaId) {
      return NextResponse.json({ error: 'ID de marca inválido' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateMarcaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { nombre } = validation.data;

    // Si se está actualizando el nombre, verificar que no exista otra marca del mismo usuario con ese nuevo nombre
    if (nombre) {
      const { data: existingMarca, error: selectError } = await supabase
        .from('marcas')
        .select('id')
        .eq('user_id', user.id)
        .eq('nombre', nombre)
        .neq('id', marcaId) // Excluir la marca actual de la búsqueda
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error verificando unicidad de nombre de marca al actualizar:', selectError);
        return NextResponse.json({ error: 'Error al verificar nombre: ' + selectError.message }, { status: 500 });
      }

      if (existingMarca) {
        return NextResponse.json({ error: 'Ya existe otra marca con este nombre.' }, { status: 409 });
      }
    }

    const { data: updatedMarca, error: updateError } = await supabase
      .from('marcas')
      .update(validation.data) // Solo se envían los campos validados
      .eq('id', marcaId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') { // Not found or no rows updated (RLS might prevent update)
        return NextResponse.json({ error: 'Marca no encontrada o no se pudo actualizar' }, { status: 404 });
      }
      if (updateError.code === '23505') { // Unique violation (aunque ya lo chequeamos arriba, por si acaso)
        return NextResponse.json({ error: 'Ya existe una marca con este nombre.' }, { status: 409 });
      }
      console.error('Error updating marca:', updateError);
      return NextResponse.json({ error: 'Error al actualizar la marca: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedMarca);

  } catch (e) {
    console.error('Error inesperado en PUT /api/marcas/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Eliminar una marca específica
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const marcaId = await getValidatedId(params);
    if (!marcaId) {
      return NextResponse.json({ error: 'ID de marca inválido' }, { status: 400 });
    }

    const { error: deleteError, count } = await supabase
      .from('marcas')
      .delete({ count: 'exact' })
      .eq('id', marcaId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting marca:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar la marca: ' + deleteError.message }, { status: 500 });
    }
    
    if (count === 0) {
      return NextResponse.json({ error: 'Marca no encontrada o no pertenece al usuario.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Marca eliminada correctamente' }, { status: 200 }); // o 204 No Content

  } catch (e) {
    console.error('Error inesperado en DELETE /api/marcas/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 