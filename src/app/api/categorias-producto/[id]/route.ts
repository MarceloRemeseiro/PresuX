import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { z } from 'zod';
import { categoriaProductoIdSchema, updateCategoriaProductoSchema } from '@/lib/schemas/categoriaProducto';

// Helper para obtener el ID validado de los params
async function getValidatedId(params: unknown): Promise<string | null> {
  const paramsValidation = z.object({ id: categoriaProductoIdSchema }).safeParse(params);
  if (!paramsValidation.success) {
    return null;
  }
  return paramsValidation.data.id;
}

// GET: Obtener una categoría específica
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

    const categoriaId = await getValidatedId(params);
    if (!categoriaId) {
      return NextResponse.json({ error: 'ID de categoría inválido' }, { status: 400 });
    }

    const { data: categoria, error } = await supabase
      .from('categorias_producto')
      .select('*')
      .eq('id', categoriaId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
      }
      console.error('Error fetching categoria_producto:', error);
      return NextResponse.json({ error: 'Error al obtener la categoría: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(categoria);

  } catch (e) {
    console.error('Error inesperado en GET /api/categorias-producto/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Actualizar una categoría específica
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

    const categoriaId = await getValidatedId(params);
    if (!categoriaId) {
      return NextResponse.json({ error: 'ID de categoría inválido' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateCategoriaProductoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { nombre } = validation.data;

    if (nombre) {
      const { data: existingCategoria, error: selectError } = await supabase
        .from('categorias_producto')
        .select('id')
        .eq('user_id', user.id)
        .eq('nombre', nombre)
        .neq('id', categoriaId)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error verificando unicidad de nombre de categoría al actualizar:', selectError);
        return NextResponse.json({ error: 'Error al verificar nombre: ' + selectError.message }, { status: 500 });
      }

      if (existingCategoria) {
        return NextResponse.json({ error: 'Ya existe otra categoría de producto con este nombre.' }, { status: 409 });
      }
    }

    const { data: updatedCategoria, error: updateError } = await supabase
      .from('categorias_producto')
      .update(validation.data)
      .eq('id', categoriaId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Categoría no encontrada o no se pudo actualizar' }, { status: 404 });
      }
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'Ya existe una categoría de producto con este nombre.' }, { status: 409 });
      }
      console.error('Error updating categoria_producto:', updateError);
      return NextResponse.json({ error: 'Error al actualizar la categoría: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedCategoria);

  } catch (e) {
    console.error('Error inesperado en PUT /api/categorias-producto/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Eliminar una categoría específica
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

    const categoriaId = await getValidatedId(params);
    if (!categoriaId) {
      return NextResponse.json({ error: 'ID de categoría inválido' }, { status: 400 });
    }

    const { error: deleteError, count } = await supabase
      .from('categorias_producto')
      .delete({ count: 'exact' })
      .eq('id', categoriaId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting categoria_producto:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar la categoría: ' + deleteError.message }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Categoría no encontrada o no pertenece al usuario.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Categoría eliminada correctamente' }, { status: 200 });

  } catch (e) {
    console.error('Error inesperado en DELETE /api/categorias-producto/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 